import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const insightInputSchema = z.object({
  title: optionalText(180),
  content: z.string().trim().min(1, "Write the insight in your own words.").max(5000),
  reflection: optionalText(1000),
  sourceId: z.uuid().optional().or(z.literal("")),
  sourceTitle: optionalText(240),
  sourceType: z.enum(["BOOK", "ARTICLE", "VIDEO", "PODCAST", "COURSE", "CONVERSATION", "WORK", "EXPERIENCE"]).default("EXPERIENCE"),
  topicIds: z.array(z.uuid()).max(12).default([]),
  newTopics: z.array(z.string().trim().min(1).max(80)).max(5).default([]),
});

export type InsightInput = z.infer<typeof insightInputSchema>;

export const insightFiltersSchema = z.object({
  query: z.string().trim().max(120).default(""),
  topicId: z.uuid().optional(),
  sourceId: z.uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
});
export type InsightFilters = z.infer<typeof insightFiltersSchema>;

export type InsightSummary = {
  id: string;
  title: string | null;
  content: string;
  reflection: string | null;
  createdAt: Date;
  updatedAt: Date;
  nextReviewAt: Date;
  source: { id: string; title: string; type: string } | null;
  topics: Array<{ id: string; name: string; color: string }>;
};

export type InsightDetail = InsightSummary & {
  reviews: Array<{ id: string; result: "REMEMBERED" | "NEEDS_REVIEW"; reviewedAt: Date }>;
  connections: Array<{ id: string; insight: InsightSummary }>;
};

export type RotatingQuote = {
  id: string;
  text: string;
  attribution: string;
};
