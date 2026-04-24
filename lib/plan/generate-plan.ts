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
  determinePlanWeeks,
  determineWeeklyTargets,
  resolvePrimaryQualityType,
  resolveSecondaryQualityType,
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

function workoutWeight(type: WorkoutType) {
  switch (type) {
    case "long_run":
      return 1.55;
    case "intervals":
      return 1.05;
    case "tempo":
      return 1.12;
    case "recovery":
      return 0.72;
    case "rest":
      return 0;
    case "easy_run":
    default:
      return 1;
  }
}

function formatWorkoutTitle(type: WorkoutType, input: PlanGenerationInput, weekNumber: number, qualityIndex: number) {
  if (type === "easy_run") {
    return weekNumber === 1 ? "Easy run" : "Aerobic easy run";
  }

  if (type === "long_run") {
    return "Long run";
  }

  if (type === "recovery") {
    return "Recovery jog";
  }

  if (type === "rest") {
    return "Rest day";
  }

  if (type === "tempo") {
    if (input.targetType === "general_fitness") {
      return "Steady tempo";
    }

    if (input.targetType === "marathon") {
      return "Marathon tempo";
    }

    return qualityIndex === 0 ? "Tempo run" : "Tempo support";
  }

  if (input.targetType === "marathon") {
    return qualityIndex === 0 ? "Controlled fartlek" : "Marathon intervals";
  }

  if (input.targetType === "5k") {
    return qualityIndex === 0 ? "5K intervals" : "Speed intervals";
  }

  if (input.targetType === "10k") {
    return qualityIndex === 0 ? "10K intervals" : "Threshold intervals";
  }

  return qualityIndex === 0 ? "Quality session" : "Secondary quality";
}

function buildPurpose(type: WorkoutType, input: PlanGenerationInput, phase: WeeklyTargets["phase"]) {
  if (type === "rest") {
    return "Protect recovery and keep the week absorbable.";
  }

  if (type === "recovery") {
    return phase === "taper" ? "Freshen up before race week." : "Clear fatigue without adding stress.";
  }

  if (type === "easy_run") {
    return "Build aerobic consistency at a controlled effort.";
  }

  if (type === "long_run") {
    if (input.targetType === "marathon") {
      return "Build endurance and durability for longer race demands.";
    }

    if (input.targetType === "half_marathon") {
      return "Extend steady endurance while staying comfortably under control.";
    }

    return "Raise endurance gradually without a sudden jump in load.";
  }

  if (type === "tempo") {
    if (input.targetType === "general_fitness") {
      return "Add a steady aerobic stimulus without overcomplicating the week.";
    }

    if (input.targetType === "marathon") {
      return "Practice sustained effort and efficient rhythm.";
    }

    return "Practice sustained controlled effort near threshold.";
  }

  if (input.targetType === "5k") {
    return "Improve turnover and speed with controlled effort.";
  }

  if (input.targetType === "10k") {
    return "Blend speed and endurance at a sustainable hard effort.";
  }

  if (input.targetType === "half_marathon") {
    return "Support race-specific stamina and threshold strength.";
  }

  return "Maintain fitness with a small quality stimulus.";
}

function buildDescription(
  type: WorkoutType,
  input: PlanGenerationInput,
  phase: WeeklyTargets["phase"],
  targetDuration: number,
  qualityIndex: number
) {
  const durationText = `${targetDuration} min`;

  if (type === "rest") {
    return "No running today. Keep the day truly easy and let the training absorb.";
  }

  if (type === "recovery") {
    return `Move lightly for ${durationText}. The goal is to feel fresher tomorrow than you do today.`;
  }

  if (type === "easy_run") {
    return phase === "short"
      ? `Keep this controlled for about ${durationText}. Avoid pushing pace and finish with energy left.`
      : `Run relaxed for about ${durationText}. You should be able to speak in full sentences throughout.`;
  }

  if (type === "long_run") {
    const raceHint =
      input.targetType === "marathon"
        ? "This is your key endurance builder, so keep it smooth from start to finish."
        : input.targetType === "half_marathon"
          ? "This is the longest aerobic touch of the week."
          : "Finish feeling steady rather than tired.";

    return `Spend about ${durationText} on a steady easy effort. ${raceHint} The cap is set from your current profile, not a generic mileage jump.`;
  }

  if (type === "tempo") {
    const targetHint =
      input.targetType === "marathon"
        ? "Hold a sustainable rhythm without drifting too hard."
        : input.targetType === "general_fitness"
          ? "Stay comfortably strong, not strained."
          : "Hold a controlled threshold effort.";

    return `Include a warm-up and then hold tempo work inside about ${durationText}. ${targetHint} This is the smallest useful dose for your current profile.`;
  }

  const repStyle =
    input.targetType === "5k"
      ? "shorter reps with full control"
      : input.targetType === "10k"
        ? "moderate reps with steady recoveries"
        : input.targetType === "half_marathon"
          ? "cruise-style reps near threshold"
          : "controlled fartlek blocks";

  const qualifier = qualityIndex > 0 ? "This is the secondary quality session for the week." : "This is the main quality session for the week.";
  const phaseHint = phase === "taper" ? "Keep the effort snappy but leave a little in reserve." : "Stop before the workout turns ragged.";

  return `Use about ${durationText} for ${repStyle}. ${qualifier} ${phaseHint} It is sized to fit your weekly load and session limit.`;
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
        title: formatWorkoutTitle("long_run", input, targets.weekNumber, 0),
        targetRpe: workoutRpe("long_run"),
        targetEffort: workoutEffortLabel("long_run"),
        purpose: buildPurpose("long_run", input, targets.phase),
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
        title: formatWorkoutTitle(qualityType, input, targets.weekNumber, qualityIndex),
        targetRpe: workoutRpe(qualityType),
        targetEffort: workoutEffortLabel(qualityType),
        purpose: buildPurpose(qualityType, input, targets.phase),
        description: buildDescription(qualityType, input, targets.phase, 0, actualQualityIndex),
        targetDuration: 0,
        qualityIndex: actualQualityIndex
      });
      continue;
    }

    slots.push({
      type: "easy_run",
      title: formatWorkoutTitle("easy_run", input, targets.weekNumber, 0),
      targetRpe: workoutRpe("easy_run"),
      targetEffort: workoutEffortLabel("easy_run"),
      purpose: buildPurpose("easy_run", input, targets.phase),
      description: buildDescription("easy_run", input, targets.phase, 0, 0),
      targetDuration: 0
    });
  }

  return slots;
}

function buildRecoverySlot(input: PlanGenerationInput, targets: WeeklyTargets): WorkoutSlot {
  const type = input.runningLevel === "beginner" || targets.phase !== "build" ? "rest" : "recovery";

  return {
    type,
    title: formatWorkoutTitle(type, input, targets.weekNumber, 0),
    targetRpe: workoutRpe(type),
    targetEffort: workoutEffortLabel(type),
    purpose: buildPurpose(type, input, targets.phase),
    description: buildDescription(type, input, targets.phase, 0, 0),
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

  const runWeights = runSlots.map((slot) => workoutWeight(slot.type));
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
    slot.description = buildDescription(slot.type, input, targets.phase, duration, qualityIndex);
    const targetDistance = targetDistanceForDuration(input, slot.type, duration);
    if (slot.type !== "rest") {
      slot.targetDistance = targetDistance;
    }
  });

  recoverySlots.forEach((slot) => {
    slot.targetDuration = recoveryDuration;
    slot.description = buildDescription(slot.type, input, targets.phase, recoveryDuration, 0);
    const targetDistance = targetDistanceForDuration(input, slot.type, recoveryDuration);
    if (slot.type !== "rest") {
      slot.targetDistance = targetDistance;
    }
  });

  slots
    .filter((slot) => slot.type === "rest")
    .forEach((slot) => {
      slot.targetDuration = 0;
      slot.description = buildDescription(slot.type, input, targets.phase, 0, 0);
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
