import { z } from "zod";

export const reviewResultSchema = z.enum(["REMEMBERED", "NEEDS_REVIEW"]);
export type ReviewResult = z.infer<typeof reviewResultSchema>;

export type DailyReviewSession = {
  id: string;
  reviewDate: string;
  status: "ACTIVE" | "COMPLETED";
  total: number;
  remaining: number;
  currentInsightId: string | null;
};
