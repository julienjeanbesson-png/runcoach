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

function chooseFallbackOffsets(availableOffsets: number[], desiredCount: number) {
  if (desiredCount <= 0 || availableOffsets.length === 0) {
    return [];
  }

  if (availableOffsets.length <= desiredCount) {
    return availableOffsets.slice(0, desiredCount);
  }

  const chosen: number[] = [];
  for (let index = 0; index < desiredCount; index += 1) {
    const fraction = (index + 1) / (desiredCount + 1);
    const pickIndex = clamp(Math.floor(fraction * availableOffsets.length), 0, availableOffsets.length - 1);
    const pick = availableOffsets[pickIndex];
    if (!chosen.includes(pick)) {
      chosen.push(pick);
    }
  }

  for (const offset of availableOffsets) {
    if (chosen.length >= desiredCount) {
      break;
    }

    if (!chosen.includes(offset)) {
      chosen.push(offset);
    }
  }

  return chosen.slice(0, desiredCount).sort((left, right) => left - right);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getRaceWeekDayOffsets(sessionCount: number, preferredDays: number[] = [], weekStartDate: Date, targetDate: Date) {
  const raceOffset = Math.max(0, Math.min(6, Math.floor((targetDate.getTime() - weekStartDate.getTime()) / (24 * 60 * 60 * 1000))));
  const availablePreRaceOffsets = Array.from({ length: raceOffset }, (_, index) => index);
  const preRaceCount = Math.max(0, sessionCount - 1);

  if (preRaceCount === 0) {
    return [raceOffset];
  }

  const preferredSet = new Set([...new Set(preferredDays)].filter((day) => Number.isInteger(day) && day >= 0 && day <= 6));
  const preferredOffsets = availablePreRaceOffsets.filter((offset) => preferredSet.has(addDays(weekStartDate, offset).getDay()));
  const fallbackOffsets = chooseFallbackOffsets(
    availablePreRaceOffsets.filter((offset) => !preferredOffsets.includes(offset)),
    preRaceCount - preferredOffsets.length
  );

  return [...preferredOffsets.slice(0, preRaceCount), ...fallbackOffsets].slice(0, preRaceCount).concat(raceOffset);
}

export function formatWeekLabel(weekNumber: number, totalWeeks: number) {
  if (weekNumber === 1) return "This week";
  if (weekNumber === totalWeeks) return "Target week";
  return `Week ${weekNumber}`;
}
