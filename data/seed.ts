import { SCHEMA_VERSION } from "@/data/constants";
import { buildAppStateWithProfile } from "@/lib/plan/generate-plan";
import type { AppState, UserProfile } from "@/types/runcoach";

export function createBlankState(): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: null,
    activePlan: null,
    history: [],
    adaptationEvents: [],
    ui: {
      lastVisitedRoute: "/onboarding",
      selectedWeekId: null
    }
  };
}

export function createSeedProfile(): UserProfile {
  const now = new Date().toISOString();

  return {
    id: "profile-demo",
    name: "Alex",
    age: 34,
    runningLevel: "intermediate",
    currentWeeklyKm: 28,
    targetType: "10k",
    targetDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString(),
    runsPerWeek: 4,
    maxDurationPerSession: 60,
    preferredDays: [1, 3, 5, 6],
    injuryNotes: "Occasional tight calves after faster sessions.",
    onboardingCompleted: true,
    createdAt: now,
    updatedAt: now
  };
}

export function createSeedState(): AppState {
  const profile = createSeedProfile();
  const state = buildAppStateWithProfile(profile);
  const currentWeek = state.activePlan?.weeks[0];

  return {
    ...state,
    history: currentWeek
      ? [
          {
            id: "history-1",
            workoutId: currentWeek.workouts[0].id,
            workoutTitle: currentWeek.workouts[0].title,
            workoutType: currentWeek.workouts[0].type,
            status: "completed",
            completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            weekId: currentWeek.id,
            weekLabel: currentWeek.label,
            weekStartDate: currentWeek.startDate,
            weekEndDate: currentWeek.endDate,
            plannedDurationMin: currentWeek.workouts[0].targetDuration,
            plannedDistanceKm: currentWeek.workouts[0].targetDistance ?? 0,
            actualDurationMin: currentWeek.workouts[0].targetDuration,
            actualDistanceKm: currentWeek.workouts[0].targetDistance ?? 0,
            completedDurationMin: currentWeek.workouts[0].targetDuration,
            completedDistanceKm: currentWeek.workouts[0].targetDistance ?? 0,
            completed: true,
            perceivedDifficulty: "normal",
            fatigueFlag: false,
            notes: "Felt steady and controlled.",
            adapted: Boolean(currentWeek.workouts[0].adapted),
            adaptationNote: currentWeek.workouts[0].adaptationNote
          },
          {
            id: "history-2",
            workoutId: currentWeek.workouts[1].id,
            workoutTitle: currentWeek.workouts[1].title,
            workoutType: currentWeek.workouts[1].type,
            status: "shortened",
            completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            weekId: currentWeek.id,
            weekLabel: currentWeek.label,
            weekStartDate: currentWeek.startDate,
            weekEndDate: currentWeek.endDate,
            plannedDurationMin: currentWeek.workouts[1].targetDuration,
            plannedDistanceKm: currentWeek.workouts[1].targetDistance ?? 0,
            actualDurationMin: Math.round((currentWeek.workouts[1].targetDuration ?? 0) * 0.7),
            actualDistanceKm: Math.round(((currentWeek.workouts[1].targetDistance ?? 0) * 0.7 + Number.EPSILON) * 10) / 10,
            completedDurationMin: Math.round((currentWeek.workouts[1].targetDuration ?? 0) * 0.7),
            completedDistanceKm: Math.round(((currentWeek.workouts[1].targetDistance ?? 0) * 0.7 + Number.EPSILON) * 10) / 10,
            completed: true,
            perceivedDifficulty: "hard",
            fatigueFlag: true,
            notes: "Cut the last rep because the legs felt flat.",
            adapted: Boolean(currentWeek.workouts[1].adapted),
            adaptationNote: currentWeek.workouts[1].adaptationNote
          }
        ]
      : [],
    adaptationEvents: [
      {
        id: "adaptation-1",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        title: "Baseline week loaded",
        summary: "Seed data is showing a balanced intermediate week so the dashboard feels real from the start."
      }
    ],
    ui: {
      lastVisitedRoute: "/dashboard",
      selectedWeekId: state.activePlan?.currentWeekId ?? null
    }
  };
}
