export const XP_REWARDS = {
  CREATE_INSIGHT: 5,
  REVIEW_INSIGHT: 5,
  CONNECT_INSIGHT: 3,
  COMPLETE_DAILY_REVIEW: 10,
} as const;

export type XpEventType = keyof typeof XP_REWARDS;

export function levelFromXp(totalXp: number) {
  return Math.floor(totalXp / 100) + 1;
}

export function localDateKey(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function calculateStreak(lastLearningDate: string | null, currentStreak: number, today: string) {
  if (!lastLearningDate) return 1;
  const elapsedDays = Math.round(
    (Date.parse(`${today}T00:00:00.000Z`) - Date.parse(`${lastLearningDate}T00:00:00.000Z`)) / 86_400_000,
  );
  if (elapsedDays <= 0) return currentStreak;
  if (elapsedDays <= 2) return currentStreak + 1;
  return 1;
}
