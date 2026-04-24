import type {
  AppState,
  PlanGenerationInput,
  TrainingPlan,
  TrainingWeek,
  UserProfile,
  Workout,
  WorkoutType
} from "@/types/runcoach";
import { SCHEMA_VERSION, targetTypeLabels } from "@/data/constants";
import { addDays } from "@/lib/utils/date";
import {
  buildGoalCoachNotes,
  determinePlanWeeks,
  determineWeeklyTargets,
  resolveGoalLongRunBounds,
  resolvePrimaryQualityType,
  resolveSecondaryQualityType,
  resolveWorkoutDescription,
  resolveWorkoutPurpose,
  resolveWorkoutTitle,
  resolveWorkoutWeight,
  targetDistanceForDuration,
  workoutEffortLabel,
  workoutRpe,
  type WeeklyTargets,
  type WorkoutSlot
} from "@/lib/plan/rules";
import { formatWeekLabel, getSessionDayOffsets, getWeekStartDate } from "@/lib/plan/schedule";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function targetLabel(targetType: PlanGenerationInput["targetType"]) {
  return targetTypeLabels[targetType];
}

function buildRunSlots(input: PlanGenerationInput, targets: WeeklyTargets): WorkoutSlot[] {
  const slots: WorkoutSlot[] = [];
  const qualityTypes: WorkoutType[] = [];

  for (let index = 0; index < targets.qualityCount; index += 1) {
    if (index === 0) {
      qualityTypes.push(resolvePrimaryQualityType(input, targets.weekNumber));
    } else {
      qualityTypes.push(resolveSecondaryQualityType(input, targets.weekNumber));
    }
  }

  const runCount = targets.runCount;
  const qualityPositions =
    targets.qualityCount === 0
      ? []
      : targets.qualityCount === 1
        ? [runCount <= 2 ? 0 : 1]
        : runCount <= 4
          ? [1, 2]
          : [1, Math.max(3, runCount - 2)];

  for (let index = 0; index < runCount; index += 1) {
    const isLongRun = index === runCount - 1;
    const qualityIndex = qualityPositions.indexOf(index);

    if (isLongRun) {
      slots.push({
        type: "long_run",
        title: resolveWorkoutTitle("long_run", input, targets.weekNumber, 0),
        targetRpe: workoutRpe("long_run"),
        targetEffort: workoutEffortLabel("long_run"),
        purpose: resolveWorkoutPurpose("long_run", input, targets.phase),
        description: "",
        targetDuration: 0
      });
      continue;
    }

    if (qualityIndex !== -1) {
      const qualityType = qualityTypes[qualityIndex] ?? resolvePrimaryQualityType(input, targets.weekNumber);
      const actualQualityIndex = qualityIndex;
      slots.push({
        type: qualityType,
        title: resolveWorkoutTitle(qualityType, input, targets.weekNumber, qualityIndex),
        targetRpe: workoutRpe(qualityType),
        targetEffort: workoutEffortLabel(qualityType),
        purpose: resolveWorkoutPurpose(qualityType, input, targets.phase),
        description: resolveWorkoutDescription(qualityType, input, targets.phase, 0, actualQualityIndex),
        targetDuration: 0,
        qualityIndex: actualQualityIndex
      });
      continue;
    }

    slots.push({
      type: "easy_run",
      title: resolveWorkoutTitle("easy_run", input, targets.weekNumber, 0),
      targetRpe: workoutRpe("easy_run"),
      targetEffort: workoutEffortLabel("easy_run"),
      purpose: resolveWorkoutPurpose("easy_run", input, targets.phase),
      description: resolveWorkoutDescription("easy_run", input, targets.phase, 0, 0),
      targetDuration: 0
    });
  }

  return slots;
}

function buildRecoverySlot(input: PlanGenerationInput, targets: WeeklyTargets): WorkoutSlot {
  const type = input.runningLevel === "beginner" || targets.phase !== "build" ? "rest" : "recovery";

  return {
    type,
    title: resolveWorkoutTitle(type, input, targets.weekNumber, 0),
    targetRpe: workoutRpe(type),
    targetEffort: workoutEffortLabel(type),
    purpose: resolveWorkoutPurpose(type, input, targets.phase),
    description: resolveWorkoutDescription(type, input, targets.phase, 0, 0),
    targetDuration: 0
  };
}

function insertRecoverySlot(slots: WorkoutSlot[], recoverySlot: WorkoutSlot, input: PlanGenerationInput, targets: WeeklyTargets) {
  const insertIndex =
    input.runningLevel === "beginner" || targets.phase !== "build" ? 1 : Math.max(2, slots.length - 2);
  slots.splice(clamp(insertIndex, 0, slots.length), 0, recoverySlot);
  return slots;
}

function slotPriority(slot: WorkoutSlot) {
  switch (slot.type) {
    case "long_run":
      return 0;
    case "tempo":
    case "intervals":
      return 1;
    case "easy_run":
      return 2;
    case "recovery":
      return 3;
    case "rest":
    default:
      return 4;
  }
}

function capWorkoutSlots(slots: WorkoutSlot[], maxRuns: number) {
  return slots
    .map((slot, index) => ({
      slot,
      index,
      priority: slotPriority(slot),
      qualityIndex: slot.qualityIndex ?? 0
    }))
    .sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }

      if (left.priority === 1 && right.priority === 1 && left.qualityIndex !== right.qualityIndex) {
        return left.qualityIndex - right.qualityIndex;
      }

      return left.index - right.index;
    })
    .slice(0, maxRuns)
    .sort((left, right) => left.index - right.index)
    .map((entry) => entry.slot);
}

function distributeDurations(input: PlanGenerationInput, targets: WeeklyTargets, slots: WorkoutSlot[]) {
  const runSlots = slots.filter((slot) => slot.type !== "rest" && slot.type !== "recovery");
  const recoverySlots = slots.filter((slot) => slot.type === "recovery");

  const recoveryDuration =
    recoverySlots.length > 0
      ? clamp(Math.round(input.maxDurationPerSession * (input.runningLevel === "beginner" ? 0.3 : targets.phase === "taper" ? 0.22 : 0.25)), 0, input.maxDurationPerSession)
      : 0;
  const runDurationBudget = Math.max(0, targets.targetMinutes - recoveryDuration);

  const runWeights: number[] = runSlots.map((slot) => resolveWorkoutWeight(slot.type, input));
  const weightTotal = runWeights.reduce((sum, weight) => sum + weight, 0) || 1;

  runSlots.forEach((slot, index) => {
    const weightedDuration = runDurationBudget * (runWeights[index] / weightTotal);
    const minDuration =
      slot.type === "long_run"
        ? Math.min(input.maxDurationPerSession, input.runningLevel === "beginner" ? 45 : input.runningLevel === "intermediate" ? 55 : 70)
        : slot.type === "tempo" || slot.type === "intervals"
          ? Math.min(input.maxDurationPerSession, input.runningLevel === "beginner" ? 25 : input.runningLevel === "intermediate" ? 35 : 45)
          : Math.min(input.maxDurationPerSession, input.runningLevel === "beginner" ? 30 : input.runningLevel === "intermediate" ? 35 : 40);
    const maxDuration = input.maxDurationPerSession;
    const duration = clamp(Math.round(weightedDuration), minDuration, maxDuration);

    slot.targetDuration = duration;
    const qualityIndex = slot.qualityIndex ?? 0;
    slot.description = resolveWorkoutDescription(slot.type, input, targets.phase, duration, qualityIndex);
    const targetDistance = targetDistanceForDuration(input, slot.type, duration);
    if (slot.type !== "rest") {
      slot.targetDistance = targetDistance;
    }
  });

  recoverySlots.forEach((slot) => {
    slot.targetDuration = recoveryDuration;
    slot.description = resolveWorkoutDescription(slot.type, input, targets.phase, recoveryDuration, 0);
    const targetDistance = targetDistanceForDuration(input, slot.type, recoveryDuration);
    if (slot.type !== "rest") {
      slot.targetDistance = targetDistance;
    }
  });

  slots
    .filter((slot) => slot.type === "rest")
    .forEach((slot) => {
      slot.targetDuration = 0;
      slot.description = resolveWorkoutDescription(slot.type, input, targets.phase, 0, 0);
      slot.targetDistance = 0;
    });

  return slots;
}

function buildWeek(
  input: PlanGenerationInput,
  weekNumber: number,
  totalWeeks: number,
  weekStart: Date,
  targets: WeeklyTargets
): TrainingWeek {
  const runSlots = buildRunSlots(input, targets);
  const recoverySlot = targets.extraRecoverySlot ? buildRecoverySlot(input, targets) : null;
  const slots = recoverySlot ? insertRecoverySlot(runSlots, recoverySlot, input, targets) : runSlots;
  const maxRuns = Math.max(1, Math.round(input.runsPerWeek));
  const cappedSlots = capWorkoutSlots(slots, maxRuns);
  const allocatedSlots = distributeDurations(input, targets, cappedSlots);
  const weekLabel = formatWeekLabel(weekNumber, totalWeeks);
  const dayOffsets = getSessionDayOffsets(allocatedSlots.length, input.preferredDays, weekStart);
  let workouts = allocatedSlots.map((slot, slotIndex) => {
    const workoutDate = addDays(weekStart, dayOffsets[slotIndex] ?? Math.min(slotIndex * 2, 6));
    return {
      id: `week-${weekNumber}-workout-${slotIndex + 1}`,
      date: workoutDate.toISOString(),
      dayLabel: workoutDate.toLocaleDateString("en-US", { weekday: "short" }),
      title: slot.title,
      type: slot.type,
      description: slot.description,
      targetDuration: slot.targetDuration,
      durationMin: slot.targetDuration,
      targetDistance: slot.targetDistance && slot.targetDistance > 0 ? round(slot.targetDistance) : undefined,
      distanceKm: slot.targetDistance && slot.targetDistance > 0 ? round(slot.targetDistance) : 0,
      targetRpe: slot.targetRpe,
      targetEffort: slot.targetEffort,
      purpose: slot.purpose,
      status: "planned"
    } satisfies Workout;
  });
  if (workouts.length > maxRuns) {
    workouts = workouts.slice(0, maxRuns);
  }

  const totalDurationMin = workouts.reduce((sum, workout) => sum + workout.targetDuration, 0);
  const totalKm = workouts.reduce((sum, workout) => sum + (workout.targetDistance ?? 0), 0);

  return {
    id: `week-${weekNumber}`,
    weekNumber,
    label: weekLabel,
    phase: targets.phase,
    progressionRole: targets.progressionRole,
    progressionExplanation: targets.progressionExplanation,
    startDate: weekStart.toISOString(),
    endDate: addDays(weekStart, 6).toISOString(),
    totalKm: round(totalKm),
    totalDurationMin: Math.round(totalDurationMin),
    workouts
  };
}

export function generateTrainingPlan(profile: PlanGenerationInput): TrainingPlan {
  const totalWeeks = determinePlanWeeks(profile);
  const createdAt = new Date().toISOString();
  const startDate = new Date();
  const weeks: TrainingWeek[] = [];
  const goalBounds = resolveGoalLongRunBounds(profile);
  const coachNotes = buildGoalCoachNotes(profile, totalWeeks, goalBounds.peakKm);
  let previousTargetKm: number | undefined;

  for (let weekNumber = 1; weekNumber <= totalWeeks; weekNumber += 1) {
    const weekStart = getWeekStartDate(startDate, weekNumber - 1);
    const targets = determineWeeklyTargets(profile, totalWeeks, weekNumber, previousTargetKm);
    previousTargetKm = targets.targetKm;
    weeks.push(buildWeek(profile, weekNumber, totalWeeks, weekStart, targets));
  }

  return {
    id: `plan-${profile.targetType}-${startDate.toISOString().slice(0, 10)}`,
    title: `${targetLabel(profile.targetType)} plan`,
    createdAt,
    updatedAt: createdAt,
    startDate: startDate.toISOString(),
    targetDate: profile.targetDate,
    totalWeeks,
    currentWeekId: weeks[0]?.id ?? "week-1",
    coachNotes,
    weeks
  };
}

export function buildAppStateWithProfile(profile: UserProfile): AppState {
  const activePlan = generateTrainingPlan(profile);

  return {
    schemaVersion: SCHEMA_VERSION,
    profile,
    activePlan,
    history: [],
    adaptationEvents: [],
    ui: {
      lastVisitedRoute: "/dashboard",
      selectedWeekId: activePlan.currentWeekId
    }
  };
}
