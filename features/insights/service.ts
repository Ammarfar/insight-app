import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { insightConnections, insights, insightTopics, sources, topics, userPreferences } from "@/db/schema";
import { addDaysToDateKey, localDateKey } from "@/features/progress/domain";
import { recordXp } from "@/features/progress/service";
import type { InsightInput } from "./contracts";
import { canonicalConnectionPair } from "./domain";

async function resolveSource(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], userId: string, input: InsightInput) {
  if (input.sourceId) {
    const source = await tx.query.sources.findFirst({ where: and(eq(sources.id, input.sourceId), eq(sources.userId, userId)) });
    if (!source) throw new Error("The selected source is not available.");
    return source.id;
  }
  if (!input.sourceTitle) return null;
  const existing = await tx.query.sources.findFirst({ where: and(eq(sources.userId, userId), eq(sources.title, input.sourceTitle), eq(sources.type, input.sourceType)) });
  if (existing) return existing.id;
  const [created] = await tx.insert(sources).values({ userId, title: input.sourceTitle, type: input.sourceType }).returning({ id: sources.id });
  return created.id;
}

async function resolveTopics(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], userId: string, input: InsightInput) {
  const selected = input.topicIds.length
    ? await tx.select({ id: topics.id }).from(topics).where(and(eq(topics.userId, userId), inArray(topics.id, input.topicIds)))
    : [];
  if (selected.length !== input.topicIds.length) throw new Error("One or more selected topics are not available.");
  for (const name of [...new Set(input.newTopics.map((value) => value.trim()).filter(Boolean))]) {
    await tx.insert(topics).values({ userId, name }).onConflictDoNothing();
  }
  const normalizedNames = input.newTopics.map((name) => name.toLowerCase());
  const created = normalizedNames.length
    ? await tx.select({ id: topics.id }).from(topics).where(and(eq(topics.userId, userId), inArray(sql`lower(${topics.name})`, normalizedNames)))
    : [];
  return [...new Set([...selected, ...created].map((topic) => topic.id))];
}

export async function createInsight(userId: string, input: InsightInput) {
  return db.transaction(async (tx) => {
    const preferences = await tx.query.userPreferences.findFirst({ where: eq(userPreferences.userId, userId) });
    const now = new Date();
    const dueDate = addDaysToDateKey(localDateKey(now, preferences?.timezone ?? "UTC"), 1);
    const [sourceId, topicIds] = await Promise.all([resolveSource(tx, userId, input), resolveTopics(tx, userId, input)]);
    const [insight] = await tx.insert(insights).values({
      userId, sourceId, title: input.title || null, content: input.content,
      reflection: input.reflection || null, nextReviewAt: new Date(`${dueDate}T12:00:00.000Z`),
    }).returning();
    if (topicIds.length) await tx.insert(insightTopics).values(topicIds.map((topicId) => ({ insightId: insight.id, topicId })));
    await recordXp(tx, { userId, type: "CREATE_INSIGHT", entityId: insight.id, eventKey: `insight:create:${insight.id}`, now });
    await tx.update(userPreferences).set({ lastDataChangedAt: now, updatedAt: now }).where(eq(userPreferences.userId, userId));
    return insight;
  });
}

export async function updateInsight(userId: string, insightId: string, input: InsightInput) {
  return db.transaction(async (tx) => {
    const owned = await tx.query.insights.findFirst({ where: and(eq(insights.id, insightId), eq(insights.userId, userId)) });
    if (!owned) throw new Error("Insight not found.");
    const [sourceId, topicIds] = await Promise.all([resolveSource(tx, userId, input), resolveTopics(tx, userId, input)]);
    await tx.update(insights).set({ sourceId, title: input.title || null, content: input.content, reflection: input.reflection || null, updatedAt: new Date() }).where(eq(insights.id, insightId));
    await tx.delete(insightTopics).where(eq(insightTopics.insightId, insightId));
    if (topicIds.length) await tx.insert(insightTopics).values(topicIds.map((topicId) => ({ insightId, topicId })));
    await tx.update(userPreferences).set({ lastDataChangedAt: new Date(), updatedAt: new Date() }).where(eq(userPreferences.userId, userId));
  });
}

export async function deleteInsight(userId: string, insightId: string) {
  return db.transaction(async (tx) => {
    const deleted = await tx.delete(insights).where(and(eq(insights.id, insightId), eq(insights.userId, userId))).returning({ id: insights.id });
    if (!deleted.length) throw new Error("Insight not found.");
    await tx.update(userPreferences).set({ lastDataChangedAt: new Date(), updatedAt: new Date() }).where(eq(userPreferences.userId, userId));
  });
}

export async function connectInsights(userId: string, firstId: string, secondId: string) {
  const [sourceInsightId, targetInsightId] = canonicalConnectionPair(firstId, secondId);
  return db.transaction(async (tx) => {
    const owned = await tx.select({ id: insights.id }).from(insights).where(and(eq(insights.userId, userId), inArray(insights.id, [sourceInsightId, targetInsightId])));
    if (owned.length !== 2) throw new Error("Both insights must belong to you.");
    const inserted = await tx.insert(insightConnections).values({ userId, sourceInsightId, targetInsightId }).onConflictDoNothing().returning({ id: insightConnections.id });
    if (!inserted.length) return false;
    await recordXp(tx, { userId, type: "CONNECT_INSIGHT", entityId: inserted[0].id, eventKey: `connection:${sourceInsightId}:${targetInsightId}` });
    await tx.update(userPreferences).set({ lastDataChangedAt: new Date(), updatedAt: new Date() }).where(eq(userPreferences.userId, userId));
    return true;
  });
}

export async function disconnectInsights(userId: string, connectionId: string) {
  await db.transaction(async (tx) => {
    await tx.delete(insightConnections).where(and(eq(insightConnections.id, connectionId), eq(insightConnections.userId, userId)));
    await tx.update(userPreferences).set({ lastDataChangedAt: new Date(), updatedAt: new Date() }).where(eq(userPreferences.userId, userId));
  });
}
