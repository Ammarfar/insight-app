import { z } from "zod";

export const THEME_COOKIE_NAME = "insightflow-theme";
export const themeModeSchema = z.enum(["light", "dark"]);

export type ThemeMode = z.infer<typeof themeModeSchema>;

export function parseThemeMode(value: unknown): ThemeMode {
  const result = themeModeSchema.safeParse(value);
  return result.success ? result.data : "light";
}
