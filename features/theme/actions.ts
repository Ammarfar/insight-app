"use server";

import { cookies } from "next/headers";
import { THEME_COOKIE_NAME, themeModeSchema } from "./contracts";
import type { ActionState } from "@/features/shared/contracts";
import type { ThemeMode } from "./contracts";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export async function updateThemeAction(value: string): Promise<ActionState<{ theme: ThemeMode }>> {
  const parsed = themeModeSchema.safeParse(value);
  if (!parsed.success) return { status: "error", message: "Choose a valid theme." };

  try {
    const cookieStore = await cookies();
    cookieStore.set(THEME_COOKIE_NAME, parsed.data, {
      httpOnly: true,
      maxAge: ONE_YEAR_IN_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return { status: "success", data: { theme: parsed.data } };
  } catch {
    return { status: "error", message: "Theme could not be saved. Please try again." };
  }
}
