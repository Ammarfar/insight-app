import "server-only";
import { createHash } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  backups, dailyReviewSessions, insightConnections, insightReviews, insights, insightTopics,
  sources, topics, userPreferences, userProgress, xpEvents,
} from "@/db/schema";
import { levelFromXp, localDateKey } from "@/features/progress/domain";
import { backupV1Schema, DriveAuthorizationError, type BackupV1 } from "./contracts";
import { downloadBackupFile, uploadBackupFile } from "./drive";

export async function createBackupSnapshot(userId: string): Promise<BackupV1> {
  return db.transaction(async (tx) => {
    const sourceRows = await tx.select().from(sources).where(eq(sources.userId, userId));
    const topicRows = await tx.select().from(topics).where(eq(topics.userId, userId));
    const insightRows = await tx.select().from(insights).where(eq(insights.userId, userId));
    const connectionRows = await tx.select().from(insightConnections).where(eq(insightConnections.userId, userId));
    const xpRows = await tx.select().from(xpEvents).where(eq(xpEvents.userId, userId));
    const [preferences] = await tx.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
    const insightIds = insightRows.map((item) => item.id);
    const topicLinks = insightIds.length
      ? await tx.select().from(insightTopics).where(inArray(insightTopics.insightId, insightIds))
      : [];
    const reviewRows = insightIds.length
      ? await tx.select().from(insightReviews).where(inArray(insightReviews.insightId, insightIds))
      : [];
    const serialized = JSON.parse(JSON.stringify({
      version: 1,
      createdAt: new Date().toISOString(),
      sources: sourceRows.map((source) => ({ id: source.id, type: source.type, title: source.title, author: source.author, url: source.url, createdAt: source.createdAt, updatedAt: source.updatedAt })),
      topics: topicRows.map((topic) => ({ id: topic.id, name: topic.name, color: topic.color, createdAt: topic.createdAt, updatedAt: topic.updatedAt })),
      insights: insightRows.map((insight) => ({ id: insight.id, sourceId: insight.sourceId, title: insight.title, content: insight.content, reflection: insight.reflection, nextReviewAt: insight.nextReviewAt, createdAt: insight.createdAt, updatedAt: insight.updatedAt })),
      insightTopics: topicLinks,
      insightConnections: connectionRows.map((connection) => ({ id: connection.id, sourceInsightId: connection.sourceInsightId, targetInsightId: connection.targetInsightId, createdAt: connection.createdAt })),
      reviews: reviewRows,
      xpEvents: xpRows.map((event) => ({ id: event.id, type: event.type, amount: event.amount, entityId: event.entityId, eventKey: event.eventKey, createdAt: event.createdAt })),
      preferences: { timezone: preferences?.timezone ?? "UTC", automaticBackupEnabled: preferences?.automaticBackupEnabled ?? false },
    }));
    return backupV1Schema.parse(serialized);
  }, { isolationLevel: "repeatable read", accessMode: "read only" });
}

export async function createDriveBackup(userId: string, type: "MANUAL" | "AUTOMATIC") {
  const [record] = await db.insert(backups).values({ userId, type, status: "PENDING" }).returning();
  try {
    const snapshot = await createBackupSnapshot(userId);
    const content = JSON.stringify(snapshot, null, 2);
    const checksum = createHash("sha256").update(content).digest("hex");
    const driveFileId = await uploadBackupFile(userId, `insightflow-${snapshot.createdAt.replace(/[:.]/g, "-")}.json`, content);
    await db.update(backups).set({ driveFileId, status: "COMPLETED", sizeBytes: Buffer.byteLength(content), checksum, completedAt: new Date() }).where(eq(backups.id, record.id));
    return record.id;
  } catch (error) {
    await db.update(backups).set({ status: "FAILED", errorMessage: error instanceof Error ? error.message : "Backup failed.", completedAt: new Date() }).where(eq(backups.id, record.id));
    if (error instanceof DriveAuthorizationError) {
      await db.update(userPreferences).set({ automaticBackupEnabled: false, updatedAt: new Date() })
        .where(eq(userPreferences.userId, userId));
    }
    throw error;
  }
}

export async function runAutomaticBackup(userId: string) {
  const preferences = await db.query.userPreferences.findFirst({ where: eq(userPreferences.userId, userId) });
  if (!preferences?.automaticBackupEnabled || !preferences.lastDataChangedAt) return;
  const latest = await db.query.backups.findFirst({
    where: and(eq(backups.userId, userId), eq(backups.status, "COMPLETED")),
    orderBy: desc(backups.createdAt),
  });
  if (latest && latest.createdAt > new Date(Date.now() - 86_400_000)) return;
  const active = await db.query.backups.findFirst({ where: and(eq(backups.userId, userId), eq(backups.status, "PENDING")) });
  if (!active) await createDriveBackup(userId, "AUTOMATIC");
}

function deriveRestoredProgress(snapshot: BackupV1) {
  const totalXp = snapshot.xpEvents.reduce((total, event) => total + event.amount, 0);
  const dates = [...new Set(snapshot.xpEvents.map((event) => localDateKey(new Date(event.createdAt), snapshot.preferences.timezone)))].sort().reverse();
  let streak = 0;
  for (let index = 0; index < dates.length; index += 1) {
    if (index === 0) { streak = 1; continue; }
    const gap = (Date.parse(`${dates[index - 1]}T00:00:00Z`) - Date.parse(`${dates[index]}T00:00:00Z`)) / 86_400_000;
    if (gap > 2) break;
    streak += 1;
  }
  return { totalXp, level: levelFromXp(totalXp), currentStreak: streak, longestStreak: streak, lastLearningDate: dates[0] ?? null };
}

export async function restoreDriveBackup(userId: string, backupId: string) {
  const record = await db.query.backups.findFirst({ where: and(eq(backups.id, backupId), eq(backups.userId, userId), eq(backups.status, "COMPLETED")) });
  if (!record?.driveFileId) throw new Error("Backup file is not available.");
  const snapshot = backupV1Schema.parse(JSON.parse(await downloadBackupFile(userId, record.driveFileId)));
  const sourceIds = new Set(snapshot.sources.map((item) => item.id));
  const topicIds = new Set(snapshot.topics.map((item) => item.id));
  const insightIds = new Set(snapshot.insights.map((item) => item.id));
  if (snapshot.insights.some((item) => item.sourceId && !sourceIds.has(item.sourceId)) ||
      snapshot.insightTopics.some((item) => !insightIds.has(item.insightId) || !topicIds.has(item.topicId)) ||
      snapshot.insightConnections.some((item) => !insightIds.has(item.sourceInsightId) || !insightIds.has(item.targetInsightId)) ||
      snapshot.reviews.some((item) => !insightIds.has(item.insightId))) {
    throw new Error("Backup contains invalid relationships.");
  }

  await db.transaction(async (tx) => {
    await tx.delete(dailyReviewSessions).where(eq(dailyReviewSessions.userId, userId));
    await tx.delete(insightConnections).where(eq(insightConnections.userId, userId));
    if ((await tx.select({ id: insights.id }).from(insights).where(eq(insights.userId, userId))).length) await tx.delete(insights).where(eq(insights.userId, userId));
    await tx.delete(sources).where(eq(sources.userId, userId));
    await tx.delete(topics).where(eq(topics.userId, userId));
    await tx.delete(xpEvents).where(eq(xpEvents.userId, userId));

    if (snapshot.sources.length) await tx.insert(sources).values(snapshot.sources.map((item) => ({ ...item, userId, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) })));
    if (snapshot.topics.length) await tx.insert(topics).values(snapshot.topics.map((item) => ({ ...item, userId, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) })));
    if (snapshot.insights.length) await tx.insert(insights).values(snapshot.insights.map((item) => ({ ...item, userId, nextReviewAt: new Date(item.nextReviewAt), createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) })));
    if (snapshot.insightTopics.length) await tx.insert(insightTopics).values(snapshot.insightTopics.map((item) => ({ ...item, createdAt: new Date(item.createdAt) })));
    if (snapshot.insightConnections.length) await tx.insert(insightConnections).values(snapshot.insightConnections.map((item) => ({ ...item, userId, createdAt: new Date(item.createdAt) })));
    if (snapshot.reviews.length) await tx.insert(insightReviews).values(snapshot.reviews.map((item) => ({ ...item, reviewedAt: new Date(item.reviewedAt) })));
    if (snapshot.xpEvents.length) await tx.insert(xpEvents).values(snapshot.xpEvents.map((item) => ({ ...item, userId, createdAt: new Date(item.createdAt) })));
    const progress = deriveRestoredProgress(snapshot);
    await tx.insert(userProgress).values({ userId, ...progress }).onConflictDoUpdate({ target: userProgress.userId, set: { ...progress, updatedAt: new Date() } });
    await tx.update(userPreferences).set({ ...snapshot.preferences, lastDataChangedAt: new Date(), updatedAt: new Date() }).where(eq(userPreferences.userId, userId));
  });
}

export async function getBackupSettings(userId: string) {
  const [preferences, history] = await Promise.all([
    db.query.userPreferences.findFirst({ where: eq(userPreferences.userId, userId) }),
    db.select().from(backups).where(eq(backups.userId, userId)).orderBy(desc(backups.createdAt)).limit(10),
  ]);
  return { preferences, history };
}
