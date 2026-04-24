import { addDays } from "@/lib/utils/date";

export function getWeekStartDate(baseDate: Date, weekIndex: number) {
  return addDays(baseDate, weekIndex * 7);
}

export function getSessionDayOffsets(sessionCount: number, preferredDays: number[] = [], weekStartDate?: Date) {
  const preferredSet = new Set(
    [...new Set(preferredDays)].filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
  );

  const preferredOffsets =
    weekStartDate && preferredSet.size > 0
      ? Array.from({ length: 7 }, (_, index) => {
          const dayDate = addDays(weekStartDate, index);
          return preferredSet.has(dayDate.getDay()) ? index : null;
        }).filter((offset): offset is number => offset !== null)
      : [];

  if (preferredOffsets.length > 0) {
    return preferredOffsets.slice(0, sessionCount);
  }

  if (sessionCount <= 1) return [3];
  if (sessionCount === 2) return [0, 6];
  if (sessionCount === 3) return [0, 3, 6];
  if (sessionCount === 4) return [0, 2, 4, 6];
  if (sessionCount === 5) return [0, 1, 3, 5, 6];
  if (sessionCount === 6) return [0, 1, 3, 4, 5, 6];
  return [0, 1, 2, 3, 4, 5, 6];
}

export function formatWeekLabel(weekNumber: number, totalWeeks: number) {
  if (weekNumber === 1) return "This week";
  if (weekNumber === totalWeeks) return "Target week";
  return `Week ${weekNumber}`;
}
