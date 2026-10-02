"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { requireUser } from "@/features/auth/service";

function isTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export async function updateTimezoneAction(formData: FormData) {
  const user = await requireUser();
  const timezone = String(formData.get("timezone") ?? "").trim();
  if (!isTimeZone(timezone)) throw new Error("Enter a valid IANA timezone, for example Asia/Jakarta.");
  await db.update(userPreferences).set({ timezone, updatedAt: new Date() })
    .where(eq(userPreferences.userId, user.id));
  revalidatePath("/", "layout");
}
