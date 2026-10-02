import { describe, expect, it } from "vitest";
import { addDaysToDateKey, calculateStreak, levelFromXp, localDateKey } from "./domain";

describe("progress rules", () => {
  it("derives a level every 100 XP", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(199)).toBe(2);
  });

  it("preserves a streak across one grace day", () => {
    expect(calculateStreak("2026-09-20", 7, "2026-09-22")).toBe(8);
    expect(calculateStreak("2026-09-19", 7, "2026-09-22")).toBe(1);
  });

  it("uses the user's timezone for learning dates", () => {
    expect(localDateKey(new Date("2026-09-21T18:00:00Z"), "Asia/Jakarta")).toBe("2026-09-22");
    expect(addDaysToDateKey("2026-09-22", 7)).toBe("2026-09-29");
  });
});
