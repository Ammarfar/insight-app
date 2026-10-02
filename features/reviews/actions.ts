"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireUser } from "@/features/auth/service";
import { runAutomaticBackup } from "@/features/backups/service";
import { reviewResultSchema } from "./contracts";
import { resolveDailyReview } from "./service";

export async function resolveReviewAction(formData: FormData) {
  const user = await requireUser();
  const sessionId = String(formData.get("sessionId") ?? "");
  const insightId = String(formData.get("insightId") ?? "");
  const result = reviewResultSchema.parse(formData.get("result"));
  await resolveDailyReview(user.id, sessionId, insightId, result);
  after(() => runAutomaticBackup(user.id));
  revalidatePath("/");
  revalidatePath("/progress");
}

export async function skipReviewAction(formData: FormData) {
  const user = await requireUser();
  await resolveDailyReview(user.id, String(formData.get("sessionId") ?? ""), String(formData.get("insightId") ?? ""), "SKIPPED");
  after(() => runAutomaticBackup(user.id));
  revalidatePath("/");
}
