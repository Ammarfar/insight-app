import { z } from "zod";

const dateTime = z.iso.datetime();
const sourceSchema = z.object({
  id: z.uuid(), type: z.enum(["BOOK", "ARTICLE", "VIDEO", "PODCAST", "COURSE", "CONVERSATION", "WORK", "EXPERIENCE"]),
  title: z.string(), author: z.string().nullable(), url: z.string().nullable(), createdAt: dateTime, updatedAt: dateTime,
});
const topicSchema = z.object({ id: z.uuid(), name: z.string(), color: z.string(), createdAt: dateTime, updatedAt: dateTime });
const insightSchema = z.object({
  id: z.uuid(), sourceId: z.uuid().nullable(), title: z.string().nullable(), content: z.string(), reflection: z.string().nullable(),
  nextReviewAt: dateTime, createdAt: dateTime, updatedAt: dateTime,
});

export const backupV1Schema = z.object({
  version: z.literal(1),
  createdAt: dateTime,
  sources: z.array(sourceSchema),
  topics: z.array(topicSchema),
  insights: z.array(insightSchema),
  insightTopics: z.array(z.object({ insightId: z.uuid(), topicId: z.uuid(), createdAt: dateTime })),
  insightConnections: z.array(z.object({ id: z.uuid(), sourceInsightId: z.uuid(), targetInsightId: z.uuid(), createdAt: dateTime })),
  reviews: z.array(z.object({ id: z.uuid(), insightId: z.uuid(), result: z.enum(["REMEMBERED", "NEEDS_REVIEW"]), reviewedAt: dateTime })),
  xpEvents: z.array(z.object({
    id: z.uuid(), type: z.enum(["CREATE_INSIGHT", "REVIEW_INSIGHT", "CONNECT_INSIGHT", "COMPLETE_DAILY_REVIEW"]),
    amount: z.number().int().positive(), entityId: z.uuid().nullable(), eventKey: z.string(), createdAt: dateTime,
  })),
  preferences: z.object({ timezone: z.string(), automaticBackupEnabled: z.boolean() }),
});

export type BackupV1 = z.infer<typeof backupV1Schema>;

export class DriveAuthorizationError extends Error {
  constructor(message = "Google Drive access needs to be reconnected.") {
    super(message);
    this.name = "DriveAuthorizationError";
  }
}
