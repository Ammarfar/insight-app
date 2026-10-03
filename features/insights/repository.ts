import "server-only";
import { and, count, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { insightConnections, insightReviews, insights, insightTopics, sources, topics } from "@/db/schema";
import type { InsightDetail, InsightFilters, InsightSummary } from "./contracts";
import { buildRotatingQuotes } from "./quote";

async function hydrateInsights(userId: string, ids: string[]): Promise<InsightSummary[]> {
  if (!ids.length) return [];
  const [rows, topicRows] = await Promise.all([
    db.select({
      id: insights.id, title: insights.title, content: insights.content, reflection: insights.reflection,
      createdAt: insights.createdAt, updatedAt: insights.updatedAt, nextReviewAt: insights.nextReviewAt,
      sourceId: sources.id, sourceTitle: sources.title, sourceType: sources.type,
    }).from(insights).leftJoin(sources, eq(insights.sourceId, sources.id))
      .where(and(eq(insights.userId, userId), inArray(insights.id, ids))),
    db.select({ insightId: insightTopics.insightId, id: topics.id, name: topics.name, color: topics.color })
      .from(insightTopics).innerJoin(topics, eq(insightTopics.topicId, topics.id))
      .where(inArray(insightTopics.insightId, ids)),
  ]);
  const topicMap = new Map<string, InsightSummary["topics"]>();
  for (const topic of topicRows) topicMap.set(topic.insightId, [...(topicMap.get(topic.insightId) ?? []), { id: topic.id, name: topic.name, color: topic.color }]);
  const byId = new Map(rows.map((row) => [row.id, {
    id: row.id, title: row.title, content: row.content, reflection: row.reflection,
    createdAt: row.createdAt, updatedAt: row.updatedAt, nextReviewAt: row.nextReviewAt,
    source: row.sourceId ? { id: row.sourceId, title: row.sourceTitle!, type: row.sourceType! } : null,
    topics: topicMap.get(row.id) ?? [],
  }]));
  return ids.flatMap((id) => byId.get(id) ? [byId.get(id)!] : []);
}

export async function listInsights(userId: string, filters: InsightFilters) {
  const conditions = [eq(insights.userId, userId)];
  if (filters.query) conditions.push(or(ilike(insights.title, `%${filters.query}%`), ilike(insights.content, `%${filters.query}%`))!);
  if (filters.sourceId) conditions.push(eq(insights.sourceId, filters.sourceId));
  if (filters.topicId) {
    const topicInsightIds = db.select({ id: insightTopics.insightId }).from(insightTopics).where(eq(insightTopics.topicId, filters.topicId));
    conditions.push(inArray(insights.id, topicInsightIds));
  }
  const where = and(...conditions);
  const pageSize = 12;
  const [idRows, totalRows] = await Promise.all([
    db.select({ id: insights.id }).from(insights).where(where).orderBy(desc(insights.createdAt)).limit(pageSize).offset((filters.page - 1) * pageSize),
    db.select({ value: count() }).from(insights).where(where),
  ]);
  return {
    items: await hydrateInsights(userId, idRows.map((row) => row.id)),
    page: filters.page,
    pageSize,
    total: totalRows[0]?.value ?? 0,
  };
}

export async function listRecentInsights(userId: string, limit = 4) {
  const ids = await db.select({ id: insights.id }).from(insights).where(eq(insights.userId, userId)).orderBy(desc(insights.createdAt)).limit(limit);
  return hydrateInsights(userId, ids.map((row) => row.id));
}

export async function listRotatingQuotes(userId: string) {
  const rows = await db.select({
    id: insights.id,
    content: insights.content,
    title: insights.title,
    sourceTitle: sources.title,
  }).from(insights)
    .leftJoin(sources, eq(insights.sourceId, sources.id))
    .where(eq(insights.userId, userId))
    .orderBy(sql`random()`)
    .limit(20);

  return buildRotatingQuotes(rows);
}

export async function getInsightDetail(userId: string, insightId: string): Promise<InsightDetail | null> {
  const [item] = await hydrateInsights(userId, [insightId]);
  if (!item) return null;
  const [reviews, connectionRows] = await Promise.all([
    db.select({ id: insightReviews.id, result: insightReviews.result, reviewedAt: insightReviews.reviewedAt })
      .from(insightReviews).where(eq(insightReviews.insightId, insightId)).orderBy(desc(insightReviews.reviewedAt)),
    db.select().from(insightConnections).where(and(
      eq(insightConnections.userId, userId),
      or(eq(insightConnections.sourceInsightId, insightId), eq(insightConnections.targetInsightId, insightId)),
    )),
  ]);
  const otherIds = connectionRows.map((connection) => connection.sourceInsightId === insightId ? connection.targetInsightId : connection.sourceInsightId);
  const connected = await hydrateInsights(userId, otherIds);
  return {
    ...item,
    reviews,
    connections: connectionRows.map((connection, index) => ({ id: connection.id, insight: connected[index] })).filter((value) => value.insight),
  };
}

export async function getCaptureOptions(userId: string) {
  const [topicRows, sourceRows] = await Promise.all([
    db.select().from(topics).where(eq(topics.userId, userId)).orderBy(topics.name),
    db.select().from(sources).where(eq(sources.userId, userId)).orderBy(sources.title),
  ]);
  return { topics: topicRows, sources: sourceRows };
}

export async function getConnectionCandidates(userId: string, excludedId: string) {
  const rows = await db.select({ id: insights.id }).from(insights)
    .where(and(eq(insights.userId, userId), ne(insights.id, excludedId))).orderBy(desc(insights.updatedAt)).limit(50);
  return hydrateInsights(userId, rows.map((row) => row.id));
}
