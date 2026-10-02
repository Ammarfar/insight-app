"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/service";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createDriveBackup, restoreDriveBackup } from "./service";
import type { ActionState } from "@/features/shared/contracts";

export async function createBackupAction(previous: ActionState, formData: FormData): Promise<ActionState> {
  void previous;
  void formData;
  const user = await requireUser();
  try {
    await createDriveBackup(user.id, "MANUAL");
    revalidatePath("/settings");
    return { status: "success", message: "Backup uploaded to Google Drive." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Backup failed." };
  }
}

export async function restoreBackupAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  try {
    await restoreDriveBackup(user.id, String(formData.get("backupId") ?? ""));
    revalidatePath("/", "layout");
    return { status: "success", message: "Your learning data has been restored." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Restore failed." };
  }
}

export async function toggleAutomaticBackupAction(formData: FormData) {
  const user = await requireUser();
  await db.update(userPreferences).set({ automaticBackupEnabled: formData.get("enabled") === "true", updatedAt: new Date() }).where(eq(userPreferences.userId, user.id));
  revalidatePath("/settings");
}
