"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/service";
import { runAutomaticBackup } from "@/features/backups/service";
import type { ActionState } from "@/features/shared/contracts";
import { insightInputSchema } from "./contracts";
import { connectInsights, createInsight, deleteInsight, disconnectInsights, updateInsight } from "./service";

function inputFromForm(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    content: String(formData.get("content") ?? ""),
    reflection: String(formData.get("reflection") ?? ""),
    sourceId: String(formData.get("sourceId") ?? ""),
    sourceTitle: String(formData.get("sourceTitle") ?? ""),
    sourceType: String(formData.get("sourceType") ?? "EXPERIENCE"),
    topicIds: formData.getAll("topicIds").map(String),
    newTopics: String(formData.get("newTopics") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
  };
}

function validationError<T>(error: { flatten(): { fieldErrors: Record<string, string[]> } }): ActionState<T> {
  return { status: "error", message: "Please check the highlighted fields.", fieldErrors: error.flatten().fieldErrors };
}

export async function createInsightAction(_: ActionState<{ id: string }>, formData: FormData): Promise<ActionState<{ id: string }>> {
  const user = await requireUser();
  const parsed = insightInputSchema.safeParse(inputFromForm(formData));
  if (!parsed.success) return validationError(parsed.error);
  try {
    const insight = await createInsight(user.id, parsed.data);
    after(() => runAutomaticBackup(user.id));
    revalidatePath("/", "layout");
    return { status: "success", message: "Insight captured. +5 XP", data: { id: insight.id } };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not create insight." };
  }
}

export async function updateInsightAction(insightId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = insightInputSchema.safeParse(inputFromForm(formData));
  if (!parsed.success) return validationError(parsed.error);
  try {
    await updateInsight(user.id, insightId, parsed.data);
    after(() => runAutomaticBackup(user.id));
    revalidatePath(`/insights/${insightId}`);
    revalidatePath("/insights");
    return { status: "success", message: "Insight updated." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not update insight." };
  }
}

export async function deleteInsightAction(insightId: string) {
  const user = await requireUser();
  await deleteInsight(user.id, insightId);
  after(() => runAutomaticBackup(user.id));
  revalidatePath("/", "layout");
  redirect("/insights");
}

export async function connectInsightsAction(formData: FormData) {
  const user = await requireUser();
  const insightId = String(formData.get("insightId") ?? "");
  await connectInsights(user.id, insightId, String(formData.get("targetInsightId") ?? ""));
  after(() => runAutomaticBackup(user.id));
  revalidatePath(`/insights/${insightId}`);
}

export async function disconnectInsightsAction(formData: FormData) {
  const user = await requireUser();
  const insightId = String(formData.get("insightId") ?? "");
  await disconnectInsights(user.id, String(formData.get("connectionId") ?? ""));
  after(() => runAutomaticBackup(user.id));
  revalidatePath(`/insights/${insightId}`);
}
