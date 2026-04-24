import { RUNCOACH_STORAGE_KEY } from "@/lib/storage/keys";
import { buildAppStateWithProfile, generateTrainingPlan } from "@/lib/plan/generate-plan";
import { getProgressionExplanation, getProgressionRole } from "@/lib/plan/rules";
import { SCHEMA_VERSION } from "@/data/constants";
import { createBlankState, createSeedState } from "@/data/seed";
import { normalizePreferredDays } from "@/lib/domain/profile";
import type { AppState, UserProfile } from "@/types/runcoach";

function canUseStorage() {
  return typeof window !== "undefined";
}

function parseState(raw: string | null): AppState | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AppState;
    if (parsed?.schemaVersion !== SCHEMA_VERSION) {
      return null;
    }

    const selectedWeekId = parsed.ui?.selectedWeekId ?? parsed.activePlan?.currentWeekId ?? null;
    const hasSelectedWeek =
      !parsed.activePlan || !selectedWeekId ? false : parsed.activePlan.weeks.some((week) => week.id === selectedWeekId);
    const normalizedProfile = parsed.profile
      ? {
          ...parsed.profile,
          preferredDays: normalizePreferredDays(parsed.profile.preferredDays ?? [])
        }
      : parsed.profile;
    const normalizedHistory = (parsed.history ?? []).map((entry) => {
      if (!parsed.activePlan) {
        return entry;
      }

      const week = parsed.activePlan.weeks.find((candidateWeek) => candidateWeek.id === entry.weekId) ??
        parsed.activePlan.weeks.find((candidateWeek) => candidateWeek.workouts.some((workout) => workout.id === entry.workoutId));
      const workout = parsed.activePlan.weeks.flatMap((candidateWeek) => candidateWeek.workouts).find((candidateWorkout) => candidateWorkout.id === entry.workoutId);

      if (!week || !workout) {
        return entry;
      }

      return {
        ...entry,
        weekId: entry.weekId ?? week.id,
        weekLabel: entry.weekLabel ?? week.label,
        weekStartDate: entry.weekStartDate ?? week.startDate,
        weekEndDate: entry.weekEndDate ?? week.endDate,
        plannedDurationMin: entry.plannedDurationMin ?? workout.targetDuration,
        plannedDistanceKm: entry.plannedDistanceKm ?? (workout.targetDistance ?? 0),
        actualDurationMin: entry.actualDurationMin ?? undefined,
        actualDistanceKm: entry.actualDistanceKm ?? undefined,
        actualPaceSecondsPerKm:
          entry.actualPaceSecondsPerKm ??
          (entry.actualDurationMin && entry.actualDistanceKm ? (entry.actualDurationMin * 60) / entry.actualDistanceKm : null),
        completedDurationMin: entry.completedDurationMin ?? (entry.completed ? workout.targetDuration : 0),
        completedDistanceKm: entry.completedDistanceKm ?? (entry.completed ? workout.targetDistance ?? 0 : 0),
        adapted: entry.adapted ?? Boolean(workout.adapted),
        adaptationNote: entry.adaptationNote ?? workout.adaptationNote,
        readinessCheck: entry.readinessCheck ?? workout.readinessCheck
      };
    });
    const normalizedPlan =
      parsed.activePlan && parsed.activePlan.weeks
        ? {
            ...parsed.activePlan,
            weeks: parsed.activePlan.weeks.map((week) => {
              const progressionRole = week.progressionRole ?? getProgressionRole(week.weekNumber, parsed.activePlan?.totalWeeks ?? week.weekNumber, week.phase);
              return {
                ...week,
                progressionRole,
                progressionExplanation: week.progressionExplanation ?? getProgressionExplanation(progressionRole)
              };
            })
          }
        : parsed.activePlan;

    return {
      ...parsed,
      profile: normalizedProfile,
      history: normalizedHistory,
      activePlan: normalizedPlan,
      ui: {
        lastVisitedRoute: parsed.ui?.lastVisitedRoute ?? "/dashboard",
        selectedWeekId: hasSelectedWeek ? selectedWeekId : normalizedPlan?.currentWeekId ?? null
      }
    };
  } catch {
    return null;
  }
}

export function loadAppState() {
  if (!canUseStorage()) {
    return null;
  }

  return parseState(window.localStorage.getItem(RUNCOACH_STORAGE_KEY));
}

export function saveAppState(state: AppState) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(RUNCOACH_STORAGE_KEY, JSON.stringify(state));
}

export function clearAppState() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(RUNCOACH_STORAGE_KEY);
}

export function createInitialAppState() {
  return loadAppState() ?? createSeedState();
}

export function createStateFromProfile(profile: UserProfile) {
  return buildAppStateWithProfile(profile);
}

export function createResetState() {
  return createBlankState();
}

export function createRegeneratedPlan(profile: UserProfile, currentState: AppState) {
  const nextPlan = generateTrainingPlan(profile);

  return {
    ...currentState,
    activePlan: nextPlan,
    ui: {
      ...currentState.ui,
      selectedWeekId: nextPlan.currentWeekId
    }
  } satisfies AppState;
}
