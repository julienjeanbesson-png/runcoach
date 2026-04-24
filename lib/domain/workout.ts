import type { TrainingPlan, TrainingWeek, Workout, WorkoutStatus } from "@/types/runcoach";

export function getCurrentWeek(plan: TrainingPlan | null) {
  return plan?.weeks.find((week) => week.id === plan.currentWeekId) ?? plan?.weeks[0] ?? null;
}

export function getWeekById(plan: TrainingPlan | null, weekId: string | null | undefined) {
  return plan?.weeks.find((week) => week.id === weekId) ?? null;
}

export function getWeekIndex(plan: TrainingPlan | null, weekId: string | null | undefined) {
  if (!plan || !weekId) {
    return -1;
  }

  return plan.weeks.findIndex((week) => week.id === weekId);
}

export function getSelectedWeek(plan: TrainingPlan | null, selectedWeekId: string | null | undefined) {
  return getWeekById(plan, selectedWeekId) ?? getCurrentWeek(plan);
}

export function getAdjacentWeekIds(plan: TrainingPlan | null, selectedWeekId: string | null | undefined) {
  if (!plan) {
    return { previousWeekId: null, nextWeekId: null, selectedWeekIndex: -1 };
  }

  const selectedWeekIndex = getWeekIndex(plan, selectedWeekId) >= 0 ? getWeekIndex(plan, selectedWeekId) : getWeekIndex(plan, plan.currentWeekId);
  const currentWeekIndex = getWeekIndex(plan, plan.currentWeekId);
  const safeSelectedIndex = selectedWeekIndex >= 0 ? selectedWeekIndex : currentWeekIndex;

  return {
    previousWeekId: safeSelectedIndex > 0 ? plan.weeks[safeSelectedIndex - 1]?.id ?? null : null,
    nextWeekId: safeSelectedIndex < plan.weeks.length - 1 ? plan.weeks[safeSelectedIndex + 1]?.id ?? null : null,
    selectedWeekIndex: safeSelectedIndex
  };
}

export function getWeekProgressLabel(plan: TrainingPlan | null, selectedWeekId: string | null | undefined) {
  if (!plan) {
    return "Week 1";
  }

  const index = getWeekIndex(plan, selectedWeekId);
  return index >= 0 ? `Week ${index + 1}` : "Week 1";
}

export function getWorkoutById(plan: TrainingPlan | null, workoutId: string) {
  for (const week of plan?.weeks ?? []) {
    const found = week.workouts.find((workout) => workout.id === workoutId);
    if (found) {
      return found;
    }
  }

  return null;
}

export function getNextWorkout(plan: TrainingPlan | null) {
  const week = getCurrentWeek(plan);
  if (!week) {
    return null;
  }

  return week.workouts.find((workout) => workout.status === "planned") ?? week.workouts[0] ?? null;
}

export function getNextWorkoutForWeek(week: TrainingWeek | null) {
  if (!week) {
    return null;
  }

  return week.workouts.find((workout) => workout.status === "planned") ?? week.workouts[0] ?? null;
}

export function updateWorkoutStatus(workout: Workout, status: Exclude<WorkoutStatus, "planned">) {
  return {
    ...workout,
    status,
    completedAt: new Date().toISOString()
  } satisfies Workout;
}
