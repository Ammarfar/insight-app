import { beforeEach, describe, expect, it, vi } from "vitest";

const setCookie = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ set: setCookie })),
}));

import { updateThemeAction } from "./actions";
import { THEME_COOKIE_NAME } from "./contracts";

describe("updateThemeAction", () => {
  beforeEach(() => setCookie.mockClear());

  it("stores a valid theme for one year", async () => {
    const result = await updateThemeAction("dark");

    expect(result).toEqual({ status: "success", data: { theme: "dark" } });
    expect(setCookie).toHaveBeenCalledWith(THEME_COOKIE_NAME, "dark", expect.objectContaining({
      httpOnly: true,
      maxAge: 31_536_000,
      path: "/",
      sameSite: "lax",
    }));
  });

  it("rejects an invalid theme without writing a cookie", async () => {
    expect(await updateThemeAction("system")).toEqual({ status: "error", message: "Choose a valid theme." });
    expect(setCookie).not.toHaveBeenCalled();
  });
});
