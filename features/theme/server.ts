import "server-only";

import { cookies } from "next/headers";
import { parseThemeMode, THEME_COOKIE_NAME } from "./contracts";

export async function getThemeMode() {
  const cookieStore = await cookies();
  return parseThemeMode(cookieStore.get(THEME_COOKIE_NAME)?.value);
}
