import "server-only";
import { and, asc, count, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { dailyReviewItems, dailyReviewSessions, insightReviews, insights, userPreferences } from "@/db/schema";
import { addDaysToDateKey, localDateKey } from "@/features/progress/domain";
import { recordXp } from "@/features/progress/service";
import { getInsightDetail } from "@/features/insights/repository";
import type { ReviewResult } from "./contracts";

async function getUserDate(userId: string, now = new Date()) {
  const preferences = await db.query.userPreferences.findFirst({ where: eq(userPreferences.userId, userId) });
  return { date: localDateKey(now, preferences?.timezone ?? "UTC"), timezone: preferences?.timezone ?? "UTC" };
}

async function getDailySession(userId: string, reviewDate: string) {
  return db.query.dailyReviewSessions.findFirst({
    where: and(eq(dailyReviewSessions.userId, userId), eq(dailyReviewSessions.reviewDate, reviewDate)),
  });
}

async function findDueInsightIds(userId: string, reviewDate: string) {
  return db.select({ id: insights.id }).from(insights)
    .where(and(eq(insights.userId, userId), lte(insights.nextReviewAt, new Date(`${reviewDate}T23:59:59.999Z`))))
    .orderBy(asc(insights.nextReviewAt), asc(insights.createdAt)).limit(5);
}

async function ensureDailySession(userId: string, reviewDate: string) {
  const existing = await getDailySession(userId, reviewDate);
  if (existing) return existing;
  return db.transaction(async (tx) => {
    const [created] = await tx.insert(dailyReviewSessions).values({ userId, reviewDate }).onConflictDoNothing().returning();
    const active = created ?? await tx.query.dailyReviewSessions.findFirst({
      where: and(eq(dailyReviewSessions.userId, userId), eq(dailyReviewSessions.reviewDate, reviewDate)),
    });
    if (!active || !created) return active!;
    const due = await tx.select({ id: insights.id }).from(insights)
      .where(and(eq(insights.userId, userId), lte(insights.nextReviewAt, new Date(`${reviewDate}T23:59:59.999Z`))))
      .orderBy(asc(insights.nextReviewAt), asc(insights.createdAt)).limit(5);
    if (due.length) await tx.insert(dailyReviewItems).values(due.map((item, position) => ({ sessionId: active.id, insightId: item.id, position })));
    return active;
  });
}

export async function getDailyReview(userId: string) {
  const { date: reviewDate } = await getUserDate(userId);
  const storedSession = await getDailySession(userId, reviewDate);
  if (!storedSession) {
    const due = await findDueInsightIds(userId, reviewDate);
    const insight = due[0] ? await getInsightDetail(userId, due[0].id) : null;
    return {
      session: { id: "", userId, reviewDate, status: due.length ? "ACTIVE" as const : "COMPLETED" as const, completedAt: null, createdAt: new Date() },
      total: due.length, remaining: due.length, insight,
    };
  }

  const items = await db.select({ insightId: dailyReviewItems.insightId, outcome: dailyReviewItems.outcome, position: dailyReviewItems.position })
    .from(dailyReviewItems).where(eq(dailyReviewItems.sessionId, storedSession.id)).orderBy(asc(dailyReviewItems.position));
  const pending = items.filter((item) => item.outcome === "PENDING");
  const insight = pending[0] ? await getInsightDetail(userId, pending[0].insightId) : null;
  return { session: storedSession, total: items.length, remaining: pending.length, insight };
}

export async function resolveDailyReview(userId: string, sessionId: string, insightId: string, result: ReviewResult | "SKIPPED") {
  const { date: today } = await getUserDate(userId);
  const ensuredSession = sessionId ? await getDailySession(userId, today) : await ensureDailySession(userId, today);
  if (!ensuredSession) throw new Error("Daily review could not be started.");
  const resolvedSessionId = ensuredSession.id;
  await db.transaction(async (tx) => {
    const [session] = await tx.select().from(dailyReviewSessions)
      .where(and(eq(dailyReviewSessions.id, resolvedSessionId), eq(dailyReviewSessions.userId, userId)))
      .for("update");
    if (!session || session.status === "COMPLETED") throw new Error("This review session is already complete.");
    const item = await tx.query.dailyReviewItems.findFirst({ where: and(eq(dailyReviewItems.sessionId, resolvedSessionId), eq(dailyReviewItems.insightId, insightId)) });
    if (!item || item.outcome !== "PENDING") throw new Error("This insight is no longer waiting for review.");

    const now = new Date();
    await tx.update(dailyReviewItems).set({ outcome: result, resolvedAt: now }).where(and(eq(dailyReviewItems.sessionId, resolvedSessionId), eq(dailyReviewItems.insightId, insightId)));
    if (result === "SKIPPED") {
      await tx.update(insights).set({ nextReviewAt: new Date(`${addDaysToDateKey(today, 1)}T12:00:00.000Z`) }).where(and(eq(insights.id, insightId), eq(insights.userId, userId)));
    } else {
      await tx.insert(insightReviews).values({ insightId, result, reviewedAt: now });
      const nextDate = addDaysToDateKey(today, result === "REMEMBERED" ? 7 : 1);
      await tx.update(insights).set({ nextReviewAt: new Date(`${nextDate}T12:00:00.000Z`), updatedAt: now }).where(and(eq(insights.id, insightId), eq(insights.userId, userId)));
      await recordXp(tx, { userId, type: "REVIEW_INSIGHT", entityId: insightId, eventKey: `review:${resolvedSessionId}:${insightId}`, now });
    }

    const [pending] = await tx.select({ value: count() }).from(dailyReviewItems).where(and(eq(dailyReviewItems.sessionId, resolvedSessionId), eq(dailyReviewItems.outcome, "PENDING")));
    if ((pending?.value ?? 0) === 0) {
      await tx.update(dailyReviewSessions).set({ status: "COMPLETED", completedAt: now }).where(eq(dailyReviewSessions.id, resolvedSessionId));
      await recordXp(tx, { userId, type: "COMPLETE_DAILY_REVIEW", entityId: resolvedSessionId, eventKey: `daily-review:${today}`, now });
    }
    await tx.update(userPreferences).set({ lastDataChangedAt: now, updatedAt: now }).where(eq(userPreferences.userId, userId));
  });
}
