import type { AdapterAccountType } from "next-auth/adapters";
import { relations, sql } from "drizzle-orm";
import {
  boolean, check, date, index, integer, jsonb, pgEnum, pgTable,
  primaryKey, text, timestamp, uniqueIndex, uuid, varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const sourceType = pgEnum("source_type", ["BOOK", "ARTICLE", "VIDEO", "PODCAST", "COURSE", "CONVERSATION", "WORK", "EXPERIENCE"]);
export const reviewResult = pgEnum("review_result", ["REMEMBERED", "NEEDS_REVIEW"]);
export const xpEventType = pgEnum("xp_event_type", ["CREATE_INSIGHT", "REVIEW_INSIGHT", "CONNECT_INSIGHT", "COMPLETE_DAILY_REVIEW"]);
export const reviewSessionStatus = pgEnum("review_session_status", ["ACTIVE", "COMPLETED"]);
export const reviewItemOutcome = pgEnum("review_item_outcome", ["PENDING", "SKIPPED", "REMEMBERED", "NEEDS_REVIEW"]);
export const backupType = pgEnum("backup_type", ["MANUAL", "AUTOMATIC"]);
export const backupStatus = pgEnum("backup_status", ["PENDING", "COMPLETED", "FAILED"]);

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  ...timestamps,
});

export const accounts = pgTable("accounts", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").$type<AdapterAccountType>().notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
}, (table) => [
  primaryKey({ columns: [table.provider, table.providerAccountId] }),
  index("accounts_user_idx").on(table.userId),
]);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
}, (table) => [index("sessions_user_idx").on(table.userId)]);

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
}, (table) => [primaryKey({ columns: [table.identifier, table.token] })]);

export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  timezone: varchar("timezone", { length: 80 }).default("UTC").notNull(),
  automaticBackupEnabled: boolean("automatic_backup_enabled").default(false).notNull(),
  lastDataChangedAt: timestamp("last_data_changed_at", { withTimezone: true }),
  ...timestamps,
});

export const sources = pgTable("sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: sourceType("type").notNull(),
  title: varchar("title", { length: 240 }).notNull(),
  author: varchar("author", { length: 160 }),
  url: text("url"),
  ...timestamps,
}, (table) => [
  index("sources_user_created_idx").on(table.userId, table.createdAt),
  uniqueIndex("sources_user_title_type_uidx").on(table.userId, table.title, table.type),
]);

export const topics = pgTable("topics", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 80 }).notNull(),
  color: varchar("color", { length: 24 }).default("sage").notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex("topics_user_name_uidx").on(table.userId, sql`lower(${table.name})`),
  index("topics_user_idx").on(table.userId),
]);

export const insights = pgTable("insights", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
  title: varchar("title", { length: 180 }),
  content: text("content").notNull(),
  reflection: text("reflection"),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }).notNull(),
  ...timestamps,
}, (table) => [
  index("insights_user_created_idx").on(table.userId, table.createdAt),
  index("insights_user_due_idx").on(table.userId, table.nextReviewAt),
  index("insights_source_idx").on(table.sourceId),
  check("insights_content_not_blank", sql`length(trim(${table.content})) > 0`),
]);

export const insightTopics = pgTable("insight_topics", {
  insightId: uuid("insight_id").notNull().references(() => insights.id, { onDelete: "cascade" }),
  topicId: uuid("topic_id").notNull().references(() => topics.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.insightId, table.topicId] }),
  index("insight_topics_topic_idx").on(table.topicId),
]);

export const insightConnections = pgTable("insight_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sourceInsightId: uuid("source_insight_id").notNull().references(() => insights.id, { onDelete: "cascade" }),
  targetInsightId: uuid("target_insight_id").notNull().references(() => insights.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("connections_pair_uidx").on(table.userId, table.sourceInsightId, table.targetInsightId),
  index("connections_source_idx").on(table.sourceInsightId),
  index("connections_target_idx").on(table.targetInsightId),
  check("connections_canonical_pair", sql`${table.sourceInsightId} < ${table.targetInsightId}`),
]);

export const insightReviews = pgTable("insight_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  insightId: uuid("insight_id").notNull().references(() => insights.id, { onDelete: "cascade" }),
  result: reviewResult("result").notNull(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("reviews_insight_date_idx").on(table.insightId, table.reviewedAt)]);

export const xpEvents = pgTable("xp_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: xpEventType("type").notNull(),
  amount: integer("amount").notNull(),
  entityId: uuid("entity_id"),
  eventKey: varchar("event_key", { length: 180 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("xp_events_user_key_uidx").on(table.userId, table.eventKey),
  index("xp_events_user_created_idx").on(table.userId, table.createdAt),
  check("xp_events_positive_amount", sql`${table.amount} > 0`),
]);

export const userProgress = pgTable("user_progress", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  totalXp: integer("total_xp").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastLearningDate: date("last_learning_date"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const dailyReviewSessions = pgTable("daily_review_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reviewDate: date("review_date").notNull(),
  status: reviewSessionStatus("status").default("ACTIVE").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("daily_review_user_date_uidx").on(table.userId, table.reviewDate),
  index("daily_review_user_status_idx").on(table.userId, table.status),
]);

export const dailyReviewItems = pgTable("daily_review_items", {
  sessionId: uuid("session_id").notNull().references(() => dailyReviewSessions.id, { onDelete: "cascade" }),
  insightId: uuid("insight_id").notNull().references(() => insights.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  outcome: reviewItemOutcome("outcome").default("PENDING").notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
}, (table) => [
  primaryKey({ columns: [table.sessionId, table.insightId] }),
  uniqueIndex("daily_review_position_uidx").on(table.sessionId, table.position),
]);

export const backups = pgTable("backups", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  driveFileId: text("drive_file_id"),
  version: integer("version").default(1).notNull(),
  type: backupType("type").notNull(),
  status: backupStatus("status").default("PENDING").notNull(),
  sizeBytes: integer("size_bytes"),
  checksum: varchar("checksum", { length: 64 }),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => [
  index("backups_user_created_idx").on(table.userId, table.createdAt),
  uniqueIndex("backups_user_pending_uidx")
    .on(table.userId)
    .where(sql`${table.status} = 'PENDING'`),
]);

export const usersRelations = relations(users, ({ one, many }) => ({
  preferences: one(userPreferences), progress: one(userProgress), insights: many(insights), topics: many(topics), sources: many(sources),
}));
export const insightsRelations = relations(insights, ({ one, many }) => ({
  source: one(sources, { fields: [insights.sourceId], references: [sources.id] }), topicLinks: many(insightTopics), reviews: many(insightReviews),
}));
export const insightTopicsRelations = relations(insightTopics, ({ one }) => ({
  insight: one(insights, { fields: [insightTopics.insightId], references: [insights.id] }),
  topic: one(topics, { fields: [insightTopics.topicId], references: [topics.id] }),
}));
