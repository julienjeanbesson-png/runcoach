import type { AdaptationEvent, HistoryEntry, TrainingPlan, WorkoutReadinessCheck, WorkoutStatus, WorkoutType } from "@/types/runcoach";
import { derivePaceSecondsPerKm } from "@/lib/utils/date";

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function formatDateRange(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) {
    return "Date unavailable";
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  })}`;
}

function resolveCompleted(entry: HistoryEntry) {
  if (typeof entry.completed === "boolean") {
    return entry.completed;
  }

  return entry.status !== "skipped";
}

export function summarizeHistoryProgress(history: HistoryEntry[]) {
  const completedEntries = history.filter(resolveCompleted);
  const skippedEntries = history.filter((entry) => !resolveCompleted(entry));
  const totalConsidered = completedEntries.length + skippedEntries.length;
  const completionRate = totalConsidered > 0 ? round((completedEntries.length / totalConsidered) * 100) : 0;
  const actualDistanceKm = round(
    completedEntries.reduce((sum, entry) => sum + (entry.actualDistanceKm ?? entry.plannedDistanceKm ?? 0), 0)
  );
  const actualTimeMin = Math.round(
    completedEntries.reduce((sum, entry) => sum + (entry.actualDurationMin ?? entry.plannedDurationMin ?? 0), 0)
  );
  const plannedDistanceKm = round(completedEntries.reduce((sum, entry) => sum + (entry.plannedDistanceKm ?? 0), 0));
  const plannedTimeMin = Math.round(completedEntries.reduce((sum, entry) => sum + (entry.plannedDurationMin ?? 0), 0));

  return {
    totalCompleted: completedEntries.length,
    totalSkipped: skippedEntries.length,
    completionRate,
    actualDistanceKm,
    actualTimeMin,
    plannedDistanceKm,
    plannedTimeMin
  };
}

export interface HistorySessionGroup {
  key: string;
  weekLabel: string;
  dateRange: string;
  entries: HistoryEntry[];
}

export function groupHistoryByWeek(history: HistoryEntry[]): HistorySessionGroup[] {
  const groups = new Map<string, HistorySessionGroup>();

  for (const entry of history) {
    const key = entry.weekId ?? `entry-${entry.id}`;
    const weekLabel = entry.weekLabel ?? "Unassigned week";
    const dateRange = formatDateRange(entry.weekStartDate, entry.weekEndDate);

    const existing = groups.get(key);
    if (existing) {
      existing.entries.push(entry);
      continue;
    }

    groups.set(key, {
      key,
      weekLabel,
      dateRange,
      entries: [entry]
    });
  }

  return [...groups.values()].sort((a, b) => {
    const aDate = a.entries[0]?.completedAt ?? "";
    const bDate = b.entries[0]?.completedAt ?? "";
    return bDate.localeCompare(aDate);
  });
}

export function getRecentAdaptations(events: AdaptationEvent[], limit = 3) {
  return [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export interface HistoryWorkoutRow {
  workoutId: string;
  title: string;
  type: WorkoutType;
  date: string;
  dayLabel: string;
  status: WorkoutStatus;
  purpose: string;
  targetDuration: number;
  targetDistance?: number;
  targetRpe: number;
  targetEffort: string;
  notes?: string;
  completed?: boolean;
  adapted?: boolean;
  adaptationNote?: string;
  completedAt?: string;
  plannedDurationMin?: number;
  plannedDistanceKm?: number;
  actualDurationMin?: number;
  actualDistanceKm?: number;
  actualPaceSecondsPerKm?: number | null;
  readinessCheck?: WorkoutReadinessCheck;
}

export interface TrainingLogWeek {
  key: string;
  label: string;
  dateRange: string;
  phase: TrainingPlan["weeks"][number]["phase"];
  totalKm: number;
  totalDurationMin: number;
  entries: HistoryWorkoutRow[];
}

export function buildTrainingLogWeeks(plan: TrainingPlan | null, history: HistoryEntry[]): TrainingLogWeek[] {
  const historyByWorkoutId = new Map<string, HistoryEntry>();
  for (const entry of history) {
    if (!historyByWorkoutId.has(entry.workoutId)) {
      historyByWorkoutId.set(entry.workoutId, entry);
    }
  }

  return plan?.weeks.map((week) => {
    const rows = week.workouts.map((workout) => {
      const entry = historyByWorkoutId.get(workout.id);

      return {
        workoutId: workout.id,
        title: workout.title,
        type: workout.type,
        date: workout.date,
        dayLabel: workout.dayLabel,
        status: workout.status,
        purpose: workout.purpose,
        targetDuration: workout.targetDuration,
        targetDistance: workout.targetDistance,
        targetRpe: workout.targetRpe,
        targetEffort: workout.targetEffort,
        notes: entry?.notes ?? workout.notes,
        completed: entry?.completed,
        adapted: workout.adapted ?? entry?.adapted,
        adaptationNote: workout.adaptationNote ?? entry?.adaptationNote,
        completedAt: entry?.completedAt,
        plannedDurationMin: entry?.plannedDurationMin ?? workout.targetDuration,
        plannedDistanceKm: entry?.plannedDistanceKm ?? workout.targetDistance ?? 0,
        actualDurationMin: entry?.actualDurationMin,
        actualDistanceKm: entry?.actualDistanceKm,
        actualPaceSecondsPerKm: entry?.actualPaceSecondsPerKm ?? derivePaceSecondsPerKm(entry?.actualDurationMin ?? null, entry?.actualDistanceKm ?? null),
        readinessCheck: entry?.readinessCheck ?? workout.readinessCheck
      };
    });

    return {
      key: week.id,
      label: week.label,
      dateRange: formatDateRange(week.startDate, week.endDate),
      phase: week.phase,
      totalKm: week.totalKm,
      totalDurationMin: week.totalDurationMin,
      entries: rows
    };
  }) ?? [];
}
