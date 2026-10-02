import "server-only";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { insightReviews, insights, insightTopics, topics } from "@/db/schema";
import { listInsights } from "@/features/insights/repository";

export async function listTopics(userId: string) {
  const rows = await db.select({
    id: topics.id, name: topics.name, color: topics.color, createdAt: topics.createdAt,
    insightCount: count(insightTopics.insightId),
  }).from(topics).leftJoin(insightTopics, eq(topics.id, insightTopics.topicId))
    .where(eq(topics.userId, userId)).groupBy(topics.id).orderBy(topics.name);
  return rows;
}

export async function getTopicDetail(userId: string, topicId: string) {
  const topic = await db.query.topics.findFirst({ where: and(eq(topics.id, topicId), eq(topics.userId, userId)) });
  if (!topic) return null;
  const library = await listInsights(userId, { query: "", topicId, page: 1 });
  const reviewed = await db.select({ id: insights.id, title: insights.title, reviewedAt: insightReviews.reviewedAt })
    .from(insightTopics)
    .innerJoin(insights, eq(insightTopics.insightId, insights.id))
    .innerJoin(insightReviews, eq(insights.id, insightReviews.insightId))
    .where(and(eq(insightTopics.topicId, topicId), eq(insights.userId, userId)))
    .orderBy(desc(insightReviews.reviewedAt)).limit(5);
  return { topic, insights: library.items, total: library.total, recentlyReviewed: reviewed };
}
