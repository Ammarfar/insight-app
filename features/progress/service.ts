import "server-only";
import { and, count, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { insightReviews, insights, userPreferences, userProgress, xpEvents } from "@/db/schema";
import { calculateStreak, levelFromXp, localDateKey, XP_REWARDS, type XpEventType } from "./domain";

export type DatabaseTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function recordXp(
  tx: DatabaseTransaction,
  input: { userId: string; type: XpEventType; eventKey: string; entityId?: string; now?: Date },
) {
  const now = input.now ?? new Date();
  const inserted = await tx.insert(xpEvents).values({
    userId: input.userId,
    type: input.type,
    amount: XP_REWARDS[input.type],
    eventKey: input.eventKey,
    entityId: input.entityId,
    createdAt: now,
  }).onConflictDoNothing().returning({ id: xpEvents.id });
  if (!inserted.length) return false;

  const preferences = await tx.query.userPreferences.findFirst({ where: eq(userPreferences.userId, input.userId) });
  const [progress] = await tx.select().from(userProgress)
    .where(eq(userProgress.userId, input.userId))
    .for("update");
  const timezone = preferences?.timezone ?? "UTC";
  const today = localDateKey(now, timezone);
  const current = progress ?? {
    totalXp: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastLearningDate: null,
  };
  const nextStreak = calculateStreak(current.lastLearningDate, current.currentStreak, today);
  const totalXp = current.totalXp + XP_REWARDS[input.type];

  await tx.insert(userProgress).values({
    userId: input.userId,
    totalXp,
    level: levelFromXp(totalXp),
    currentStreak: nextStreak,
    longestStreak: Math.max(current.longestStreak, nextStreak),
    lastLearningDate: today,
    updatedAt: now,
  }).onConflictDoUpdate({
    target: userProgress.userId,
    set: {
      totalXp,
      level: levelFromXp(totalXp),
      currentStreak: nextStreak,
      longestStreak: Math.max(current.longestStreak, nextStreak),
      lastLearningDate: today,
      updatedAt: now,
    },
  });
  return true;
}

export async function getProgress(userId: string) {
  const weekStart = new Date();
  weekStart.setUTCDate(weekStart.getUTCDate() - 7);
  const [progress, activity, created, reviewed, insightTotal] = await Promise.all([
    db.query.userProgress.findFirst({ where: eq(userProgress.userId, userId) }),
    db.query.xpEvents.findMany({ where: eq(xpEvents.userId, userId), orderBy: (event, { desc }) => [desc(event.createdAt)], limit: 8 }),
    db.select({ value: count() }).from(insights).where(and(eq(insights.userId, userId), gte(insights.createdAt, weekStart))),
    db.select({ value: count() }).from(insightReviews).innerJoin(insights, eq(insightReviews.insightId, insights.id))
      .where(and(eq(insights.userId, userId), gte(insightReviews.reviewedAt, weekStart))),
    db.select({ value: count() }).from(insights).where(eq(insights.userId, userId)),
  ]);
  return {
    progress: progress ?? { totalXp: 0, level: 1, currentStreak: 0, longestStreak: 0, lastLearningDate: null },
    activity,
    stats: { createdThisWeek: created[0]?.value ?? 0, reviewedThisWeek: reviewed[0]?.value ?? 0, insightTotal: insightTotal[0]?.value ?? 0 },
  };
}
