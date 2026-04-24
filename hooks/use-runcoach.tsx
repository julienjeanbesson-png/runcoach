"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { applyWorkoutFeedback } from "@/lib/plan/adaptation";
import { generateTrainingPlan } from "@/lib/plan/generate-plan";
import { applyWorkoutReadiness } from "@/lib/plan/readiness";
import {
  getAdjacentWeekIds,
  getCurrentWeek,
  getNextWorkout,
  getNextWorkoutForWeek,
  getSelectedWeek,
  getWeekById,
  getWorkoutById
} from "@/lib/domain/workout";
import { createBlankState } from "@/data/seed";
import { clearAppState, createInitialAppState, loadAppState, saveAppState } from "@/lib/storage/repository";
import { derivePaceSecondsPerKm } from "@/lib/utils/date";
import type {
  AppState,
  HistoryEntry,
  TrainingWeek,
  UserProfile,
  Workout,
  WorkoutFeedback,
  WorkoutReadinessInput
} from "@/types/runcoach";

type RunCoachAction =
  | { type: "hydrate"; payload: AppState }
  | { type: "complete_onboarding"; payload: UserProfile }
  | { type: "update_profile"; payload: UserProfile }
  | { type: "regenerate_plan" }
  | { type: "select_week"; payload: string | null }
  | { type: "reset_data" }
  | { type: "record_readiness"; payload: WorkoutReadinessInput }
  | { type: "record_feedback"; payload: WorkoutFeedback }
  | { type: "update_last_route"; payload: string };

interface RunCoachContextValue {
  state: AppState;
  hydrated: boolean;
  currentWeek: ReturnType<typeof getCurrentWeek>;
  selectedWeek: ReturnType<typeof getSelectedWeek>;
  nextWorkout: ReturnType<typeof getNextWorkout>;
  selectedWeekNextWorkout: ReturnType<typeof getNextWorkoutForWeek>;
  previousWeekId: string | null;
  nextWeekId: string | null;
  selectedWeekIndex: number;
  getWorkout: (workoutId: string) => ReturnType<typeof getWorkoutById>;
  getWeek: (weekId: string | null) => ReturnType<typeof getWeekById>;
  completeOnboarding: (profile: UserProfile) => void;
  updateProfile: (profile: UserProfile) => void;
  regeneratePlan: () => void;
  selectWeek: (weekId: string | null) => void;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  goToCurrentWeek: () => void;
  resetData: () => void;
  recordReadiness: (readiness: WorkoutReadinessInput) => void;
  recordFeedback: (feedback: WorkoutFeedback) => void;
  updateLastRoute: (route: string) => void;
}

const RunCoachContext = createContext<RunCoachContextValue | null>(null);

function createUpdatedHistoryEntry(
  feedback: WorkoutFeedback,
  week: TrainingWeek,
  workoutTitle: string,
  workoutType: HistoryEntry["workoutType"],
  workout: Workout | null
): HistoryEntry {
  const plannedDurationMin = workout?.targetDuration ?? 0;
  const plannedDistanceKm = workout?.targetDistance ?? 0;
  const actualDurationMin = feedback.actualDurationMin ?? null;
  const actualDistanceKm = feedback.actualDistanceKm ?? null;
  const actualPaceSecondsPerKm = feedback.actualPaceSecondsPerKm ?? derivePaceSecondsPerKm(actualDurationMin, actualDistanceKm);

  return {
    id: `history-${feedback.workoutId}-${feedback.submittedAt}`,
    workoutId: feedback.workoutId,
    workoutTitle,
    workoutType,
    status: feedback.completed ? "completed" : "skipped",
    completedAt: feedback.submittedAt,
    weekId: week.id,
    weekLabel: week.label,
    weekStartDate: week.startDate,
    weekEndDate: week.endDate,
    plannedDurationMin,
    plannedDistanceKm,
    actualDurationMin: actualDurationMin ?? undefined,
    actualDistanceKm: actualDistanceKm ?? undefined,
    actualPaceSecondsPerKm,
    completed: feedback.completed,
    perceivedDifficulty: feedback.perceivedDifficulty,
    fatigueFlag: feedback.fatigueFlag,
    notes: feedback.notes,
    adapted: Boolean(workout?.adapted),
    adaptationNote: workout?.adaptationNote,
    readinessCheck: workout?.readinessCheck
  };
}

function reducer(state: AppState, action: RunCoachAction): AppState {
  switch (action.type) {
    case "hydrate":
      return action.payload;
    case "complete_onboarding": {
      if (!action.payload) {
        return state;
      }

      const generatedPlan = generateTrainingPlan(action.payload);

      return {
        schemaVersion: state.schemaVersion,
        profile: action.payload,
        activePlan: generatedPlan,
        history: state.history,
        adaptationEvents: [],
        ui: {
          lastVisitedRoute: "/dashboard",
          selectedWeekId: generatedPlan.currentWeekId
        }
      };
    }
    case "regenerate_plan": {
      if (!state.profile) {
        return state;
      }

      const regeneratedPlan = generateTrainingPlan(state.profile);

      return {
        ...state,
        activePlan: regeneratedPlan,
        adaptationEvents: [],
        ui: {
          ...state.ui,
          lastVisitedRoute: "/dashboard",
          selectedWeekId: regeneratedPlan.currentWeekId
        }
      };
    }
    case "update_profile": {
      if (!action.payload) {
        return state;
      }

      const updatedPlan = generateTrainingPlan(action.payload);
      const selectedWeekId =
        state.ui.selectedWeekId && updatedPlan.weeks.some((week) => week.id === state.ui.selectedWeekId)
          ? state.ui.selectedWeekId
          : updatedPlan.currentWeekId;

      return {
        ...state,
        profile: action.payload,
        activePlan: updatedPlan,
        ui: {
          ...state.ui,
          lastVisitedRoute: "/dashboard",
          selectedWeekId
        }
      };
    }
    case "select_week":
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedWeekId: action.payload
        }
      };
    case "reset_data":
      return createBlankState();
    case "record_feedback": {
      if (!state.activePlan) {
        return state;
      }

      const targetWorkout = getWorkoutById(state.activePlan, action.payload.workoutId);
      if (!targetWorkout) {
        return state;
      }

      const targetWeek = state.activePlan.weeks.find((week) => week.workouts.some((workout) => workout.id === targetWorkout.id));
      if (!targetWeek) {
        return state;
      }

      const adapted = applyWorkoutFeedback(state.activePlan, state.profile, action.payload);

      return {
        ...state,
        activePlan: {
          ...adapted.plan,
          currentWeekId: state.activePlan.currentWeekId
        },
        history: [createUpdatedHistoryEntry(action.payload, targetWeek, targetWorkout.title, targetWorkout.type, targetWorkout), ...state.history],
        adaptationEvents: [adapted.event, ...state.adaptationEvents]
      };
    }
    case "record_readiness": {
      if (!state.activePlan) {
        return state;
      }

      const targetWorkout = getWorkoutById(state.activePlan, action.payload.workoutId);
      if (!targetWorkout || targetWorkout.status !== "planned" || targetWorkout.type === "rest") {
        return state;
      }

      const updated = applyWorkoutReadiness(targetWorkout, action.payload, state.profile);
      const nextPlan = {
        ...state.activePlan,
        updatedAt: action.payload.submittedAt,
        weeks: state.activePlan.weeks.map((week) => ({
          ...week,
          workouts: week.workouts.map((workout) => (workout.id === targetWorkout.id ? updated.workout : workout))
        }))
      };

      return {
        ...state,
        activePlan: nextPlan
      };
    }
    case "update_last_route":
      return {
        ...state,
        ui: {
          ...state.ui,
          lastVisitedRoute: action.payload
        }
      };
    default:
      return state;
  }
}

export function RunCoachProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, createInitialAppState());
  const [hydrated, setHydrated] = useState(false);
  const lastPersistedStateRef = useRef<AppState | null>(null);

  useEffect(() => {
    const stored = loadAppState();
    const nextState = stored ?? createBlankState();
    dispatch({ type: "hydrate", payload: nextState });
    lastPersistedStateRef.current = nextState;
    if (!stored) {
      saveAppState(nextState);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (lastPersistedStateRef.current !== state) {
      saveAppState(state);
      lastPersistedStateRef.current = state;
    }
  }, [hydrated, state]);

  const value = useMemo<RunCoachContextValue>(
    () => ({
      state,
      hydrated,
      currentWeek: getCurrentWeek(state.activePlan),
      selectedWeek: getSelectedWeek(state.activePlan, state.ui.selectedWeekId),
      nextWorkout: getNextWorkout(state.activePlan),
      selectedWeekNextWorkout: getNextWorkoutForWeek(getSelectedWeek(state.activePlan, state.ui.selectedWeekId)),
      ...getAdjacentWeekIds(state.activePlan, state.ui.selectedWeekId),
      getWorkout: (workoutId: string) => getWorkoutById(state.activePlan, workoutId),
      getWeek: (weekId: string | null) => getWeekById(state.activePlan, weekId),
      completeOnboarding: (profile: UserProfile) => dispatch({ type: "complete_onboarding", payload: profile }),
      updateProfile: (profile: UserProfile) => dispatch({ type: "update_profile", payload: profile }),
      regeneratePlan: () => dispatch({ type: "regenerate_plan" }),
      selectWeek: (weekId: string | null) => dispatch({ type: "select_week", payload: weekId }),
      goToPreviousWeek: () => {
        const adjacency = getAdjacentWeekIds(state.activePlan, state.ui.selectedWeekId);
        dispatch({ type: "select_week", payload: adjacency.previousWeekId });
      },
      goToNextWeek: () => {
        const adjacency = getAdjacentWeekIds(state.activePlan, state.ui.selectedWeekId);
        dispatch({ type: "select_week", payload: adjacency.nextWeekId });
      },
      goToCurrentWeek: () => {
        dispatch({ type: "select_week", payload: state.activePlan?.currentWeekId ?? null });
      },
      resetData: () => {
        clearAppState();
        dispatch({ type: "reset_data" });
      },
      recordReadiness: (readiness: WorkoutReadinessInput) => dispatch({ type: "record_readiness", payload: readiness }),
      recordFeedback: (feedback: WorkoutFeedback) => dispatch({ type: "record_feedback", payload: feedback }),
      updateLastRoute: (route: string) => dispatch({ type: "update_last_route", payload: route })
    }),
    [hydrated, state]
  );

  return <RunCoachContext.Provider value={value}>{children}</RunCoachContext.Provider>;
}

export function useRunCoach() {
  const context = useContext(RunCoachContext);
  if (!context) {
    throw new Error("useRunCoach must be used within RunCoachProvider");
  }

  return context;
}
