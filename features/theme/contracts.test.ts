import { describe, expect, it } from "vitest";
import { parseThemeMode } from "./contracts";

describe("parseThemeMode", () => {
  it.each([
    ["light", "light"],
    ["dark", "dark"],
    [undefined, "light"],
    ["sepia", "light"],
  ])("parses %s as %s", (value, expected) => {
    expect(parseThemeMode(value)).toBe(expected);
  });
});
