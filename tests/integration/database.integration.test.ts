import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { afterAll, describe, expect, it, vi } from "vitest";
import * as schema from "../../db/schema";
import { addDaysToDateKey, localDateKey } from "../../features/progress/domain";

vi.mock("server-only", () => ({}));

const databaseUrl = process.env.TEST_DATABASE_URL;
if (databaseUrl) process.env.DATABASE_URL = databaseUrl;

const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;
const database = pool ? drizzle({ client: pool, schema }) : null;

async function createUser(userId = randomUUID()) {
  await database!.insert(schema.users).values({ id: userId, email: `${userId}@example.test` });
  await database!.insert(schema.userPreferences).values({ userId, timezone: "Asia/Jakarta" });
  await database!.insert(schema.userProgress).values({ userId });
  return userId;
}

async function deleteUsers(...userIds: string[]) {
  for (const userId of userIds) await database!.delete(schema.users).where(eq(schema.users.id, userId));
}

describe.runIf(Boolean(databaseUrl))("PostgreSQL behavior", () => {
  afterAll(async () => pool?.end());

  it("enforces required content and cascades user-owned data", async () => {
    const userId = await createUser();
    await expect(database!.insert(schema.insights).values({ userId, content: "   ", nextReviewAt: new Date() })).rejects.toThrow();
    await database!.insert(schema.insights).values({ userId, content: "A valid integration insight", nextReviewAt: new Date() });
    await deleteUsers(userId);
    const remaining = await database!.select().from(schema.insights).where(eq(schema.insights.userId, userId));
    expect(remaining).toHaveLength(0);
  });

  it("returns at most twenty random quotes without crossing tenant boundaries", async () => {
    const firstUserId = await createUser();
    const secondUserId = await createUser();
    const ownedRows = await database!.insert(schema.insights).values(Array.from({ length: 25 }, (_, index) => ({
      userId: firstUserId,
      content: `Owned quote ${index}. More detail.`,
      nextReviewAt: new Date(),
    }))).returning({ id: schema.insights.id });
    await database!.insert(schema.insights).values({ userId: secondUserId, content: "Foreign quote.", nextReviewAt: new Date() });
    const { listRotatingQuotes } = await import("../../features/insights/repository");

    const quotes = await listRotatingQuotes(firstUserId);
    const ownedIds = new Set(ownedRows.map((row) => row.id));
    expect(quotes).toHaveLength(20);
    expect(quotes.every((quote) => ownedIds.has(quote.id))).toBe(true);
    expect(quotes.some((quote) => quote.text === "Foreign quote.")).toBe(false);
    await deleteUsers(firstUserId, secondUserId);
  });

  it("rejects cross-tenant connections and rewards a canonical pair only once", async () => {
    const firstUserId = await createUser();
    const secondUserId = await createUser();
    const [first] = await database!.insert(schema.insights).values({ userId: firstUserId, content: "First", nextReviewAt: new Date() }).returning();
    const [second] = await database!.insert(schema.insights).values({ userId: firstUserId, content: "Second", nextReviewAt: new Date() }).returning();
    const [foreign] = await database!.insert(schema.insights).values({ userId: secondUserId, content: "Foreign", nextReviewAt: new Date() }).returning();
    const { connectInsights } = await import("../../features/insights/service");

    await expect(connectInsights(firstUserId, first.id, foreign.id)).rejects.toThrow("Both insights must belong to you");
    expect(await connectInsights(firstUserId, second.id, first.id)).toBe(true);
    expect(await connectInsights(firstUserId, first.id, second.id)).toBe(false);
    const events = await database!.select().from(schema.xpEvents).where(eq(schema.xpEvents.userId, firstUserId));
    expect(events).toHaveLength(1);
    expect(events[0].amount).toBe(3);
    await deleteUsers(firstUserId, secondUserId);
  });

  it("updates XP transactionally and keeps an idempotent historical ledger", async () => {
    const userId = await createUser();
    const { recordXp } = await import("../../features/progress/service");
    await database!.transaction(async (tx) => {
      expect(await recordXp(tx, { userId, type: "CREATE_INSIGHT", eventKey: "same-event" })).toBe(true);
      expect(await recordXp(tx, { userId, type: "CREATE_INSIGHT", eventKey: "same-event" })).toBe(false);
    });
    const [progress] = await database!.select().from(schema.userProgress).where(eq(schema.userProgress.userId, userId));
    const events = await database!.select().from(schema.xpEvents).where(eq(schema.xpEvents.userId, userId));
    expect(progress.totalXp).toBe(5);
    expect(progress.level).toBe(1);
    expect(events).toHaveLength(1);
    await deleteUsers(userId);
  });

  it("awards daily review completion once and schedules remembered insights seven days out", async () => {
    const userId = await createUser();
    const [insight] = await database!.insert(schema.insights).values({
      userId,
      content: "Review me",
      nextReviewAt: new Date("2020-01-01T12:00:00.000Z"),
    }).returning();
    const { getDailyReview, resolveDailyReview } = await import("../../features/reviews/service");
    const preview = await getDailyReview(userId);
    expect(preview.total).toBe(1);
    await resolveDailyReview(userId, preview.session.id, insight.id, "REMEMBERED");
    await expect(resolveDailyReview(userId, "", insight.id, "REMEMBERED")).rejects.toThrow("already complete");

    const events = await database!.select().from(schema.xpEvents).where(eq(schema.xpEvents.userId, userId));
    expect(events.map((event) => event.amount).sort((left, right) => left - right)).toEqual([5, 10]);
    const [updated] = await database!.select().from(schema.insights).where(eq(schema.insights.id, insight.id));
    const expectedDate = addDaysToDateKey(localDateKey(new Date(), "Asia/Jakarta"), 7);
    expect(updated.nextReviewAt.toISOString().slice(0, 10)).toBe(expectedDate);
    await deleteUsers(userId);
  });

  it("cascades insight dependents while retaining historical XP", async () => {
    const userId = await createUser();
    const [topic] = await database!.insert(schema.topics).values({ userId, name: "Cascade" }).returning();
    const created = await database!.insert(schema.insights).values([
      { userId, content: "Delete me", nextReviewAt: new Date() },
      { userId, content: "Keep me", nextReviewAt: new Date() },
    ]).returning();
    const [first, second] = [...created].sort((left, right) => left.id.localeCompare(right.id));
    await database!.insert(schema.insightTopics).values({ insightId: first.id, topicId: topic.id });
    await database!.insert(schema.insightReviews).values({ insightId: first.id, result: "REMEMBERED" });
    await database!.insert(schema.insightConnections).values({ userId, sourceInsightId: first.id, targetInsightId: second.id });
    await database!.insert(schema.xpEvents).values({ userId, type: "CREATE_INSIGHT", amount: 5, entityId: first.id, eventKey: `history:${first.id}` });

    await database!.delete(schema.insights).where(and(eq(schema.insights.id, first.id), eq(schema.insights.userId, userId)));
    expect(await database!.select().from(schema.insightTopics).where(eq(schema.insightTopics.insightId, first.id))).toHaveLength(0);
    expect(await database!.select().from(schema.insightReviews).where(eq(schema.insightReviews.insightId, first.id))).toHaveLength(0);
    expect(await database!.select().from(schema.insightConnections).where(eq(schema.insightConnections.userId, userId))).toHaveLength(0);
    expect(await database!.select().from(schema.xpEvents).where(eq(schema.xpEvents.userId, userId))).toHaveLength(1);
    await deleteUsers(userId);
  });

  it("rolls back a restore-style replacement when any insert fails", async () => {
    const userId = await createUser();
    await database!.insert(schema.insights).values({ userId, content: "Original data", nextReviewAt: new Date() });
    await expect(database!.transaction(async (tx) => {
      await tx.delete(schema.insights).where(eq(schema.insights.userId, userId));
      await tx.insert(schema.insights).values({ userId, content: " ", nextReviewAt: new Date() });
    })).rejects.toThrow();
    const rows = await database!.select().from(schema.insights).where(eq(schema.insights.userId, userId));
    expect(rows.map((row) => row.content)).toEqual(["Original data"]);
    await deleteUsers(userId);
  });
});
