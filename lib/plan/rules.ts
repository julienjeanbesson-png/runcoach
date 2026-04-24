import type { PlanGenerationInput, ProgressionRole, RunningLevel, TargetType, WorkoutType } from "@/types/runcoach";

export type WeekPhase = "build" | "cutback" | "taper" | "short";

export interface WeeklyTargets {
  weekNumber: number;
  phase: WeekPhase;
  progressionRole: ProgressionRole;
  progressionExplanation: string;
  targetKm: number;
  targetMinutes: number;
  runCount: number;
  qualityCount: number;
  extraRecoverySlot: boolean;
}

export interface WorkoutSlot {
  type: WorkoutType;
  title: string;
  targetRpe: number;
  purpose: string;
  description: string;
  targetDuration: number;
  targetDistance?: number;
  targetEffort: string;
  qualityIndex?: number;
}

const TARGET_WEEK_CAP: Record<TargetType, number> = {
  "5k": 10,
  "10k": 12,
  half_marathon: 14,
  marathon: 18,
  general_fitness: 8
};

const BASE_PACE_BY_LEVEL: Record<RunningLevel, number> = {
  beginner: 7.2,
  intermediate: 6.2,
  advanced: 5.1
};

const TYPE_PACE_ADJUSTMENT: Record<WorkoutType, number> = {
  easy_run: 0.4,
  long_run: 0.55,
  intervals: -0.55,
  tempo: -0.35,
  recovery: 0.85,
  rest: 0
};

const TYPE_RPE: Record<WorkoutType, number> = {
  easy_run: 3,
  long_run: 5,
  intervals: 8,
  tempo: 7,
  recovery: 2,
  rest: 1
};

const TYPE_EFFORT: Record<WorkoutType, string> = {
  easy_run: "Easy, conversational",
  long_run: "Easy to moderate",
  intervals: "Hard but controlled",
  tempo: "Comfortably hard",
  recovery: "Very easy",
  rest: "Off"
};

const INJURY_KEYWORDS = [
  "injury",
  "pain",
  "sore",
  "swelling",
  "tight",
  "calf",
  "shin",
  "knee",
  "achilles",
  "hamstring",
  "stress fracture",
  "fracture",
  "surgery"
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

export function getProgressionRole(weekNumber: number, planWeeks: number, phase: WeekPhase): ProgressionRole {
  if (phase === "cutback") {
    return "cutback";
  }

  if (phase === "taper") {
    return "taper";
  }

  if (planWeeks > 4 && weekNumber > 1 && (weekNumber - 1) % 4 === 0) {
    return "consolidation";
  }

  return "build";
}

export function getProgressionExplanation(role: ProgressionRole) {
  switch (role) {
    case "consolidation":
      return "Holding steady to absorb the last block";
    case "cutback":
      return "Recovery week to absorb training load";
    case "taper":
      return "Reducing fatigue before target effort";
    case "build":
    default:
      return "Building aerobic volume progressively";
  }
}

function parseTargetDate(targetDate: string) {
  const parsed = new Date(targetDate);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function weeksUntilTarget(targetDate: string, startDate = new Date()) {
  const diffMs = parseTargetDate(targetDate).getTime() - startDate.getTime();
  return Math.max(1, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)));
}

export function detectInjuryRisk(injuryNotes?: string) {
  const notes = (injuryNotes ?? "").toLowerCase();
  return INJURY_KEYWORDS.some((keyword) => notes.includes(keyword));
}

export function determinePlanWeeks(input: PlanGenerationInput) {
  const targetWeeks = weeksUntilTarget(input.targetDate);
  const cap = TARGET_WEEK_CAP[input.targetType];

  if (targetWeeks <= 3) {
    return targetWeeks;
  }

  return clamp(targetWeeks, 4, cap);
}

export function determineBasePaceMinutesPerKm(input: PlanGenerationInput) {
  const base = BASE_PACE_BY_LEVEL[input.runningLevel];
  const targetAdjustment =
    input.targetType === "5k"
      ? -0.15
      : input.targetType === "10k"
        ? -0.05
        : input.targetType === "half_marathon"
          ? 0.1
          : input.targetType === "marathon"
            ? 0.18
            : 0.05;
  const ageAdjustment = input.age >= 50 ? 0.25 : input.age >= 40 ? 0.1 : 0;
  const volumeAdjustment = input.currentWeeklyKm >= 40 ? -0.15 : input.currentWeeklyKm >= 25 ? -0.08 : input.currentWeeklyKm <= 10 ? 0.12 : 0;
  const frequencyAdjustment = input.runsPerWeek >= 5 ? -0.08 : input.runsPerWeek <= 2 ? 0.08 : 0;
  const injuryAdjustment = detectInjuryRisk(input.injuryNotes) ? 0.25 : 0;

  return round(Math.max(4.5, base + targetAdjustment + ageAdjustment + volumeAdjustment + frequencyAdjustment + injuryAdjustment));
}

export function determineStartingWeeklyKm(input: PlanGenerationInput) {
  const levelFloor =
    input.runningLevel === "beginner" ? 8 : input.runningLevel === "intermediate" ? 16 : 28;
  const injuryRisk = detectInjuryRisk(input.injuryNotes);
  const current = input.currentWeeklyKm > 0 ? input.currentWeeklyKm : levelFloor;
  const conservativeStart = input.currentWeeklyKm > 0 ? current * (injuryRisk ? 0.85 : 0.95) : current;

  return round(Math.max(levelFloor, conservativeStart));
}

export function determineWeeklyTargets(
  input: PlanGenerationInput,
  planWeeks: number,
  weekNumber: number,
  previousTargetKm?: number
): WeeklyTargets {
  const injuryRisk = detectInjuryRisk(input.injuryNotes);
  const runCount = Math.max(1, Math.round(input.runsPerWeek));
  const basePace = determineBasePaceMinutesPerKm(input);
  const weekPhase = weekNumber > planWeeks - 2 ? "taper" : weekNumber > 1 && weekNumber % 4 === 0 && planWeeks > 4 ? "cutback" : planWeeks <= 3 ? "short" : "build";
  const progressionRole = getProgressionRole(weekNumber, planWeeks, weekPhase);
  const progressionExplanation = getProgressionExplanation(progressionRole);

  const progressRate =
    input.runningLevel === "beginner" ? 0.035 : input.runningLevel === "intermediate" ? 0.055 : 0.07;
  const safetyRate = input.age >= 45 ? 0.015 : 0;
  const injuryRate = injuryRisk ? 0.02 : 0;
  const cappedGrowth = clamp(progressRate - safetyRate - injuryRate, 0.015, 0.07);

  const startKm = determineStartingWeeklyKm(input);
  const anchorKm = previousTargetKm ?? startKm;
  const targetGain =
    planWeeks <= 3
      ? 0.05
      : input.targetType === "marathon"
        ? 0.28
        : input.targetType === "half_marathon"
          ? 0.22
          : input.targetType === "10k"
            ? 0.14
            : input.targetType === "5k"
              ? 0.12
              : 0.1;
  const levelGainAdjustment = input.runningLevel === "beginner" ? -0.03 : input.runningLevel === "advanced" ? 0.03 : 0;
  const ageGainAdjustment = input.age >= 45 ? -0.02 : 0;
  const injuryGainAdjustment = injuryRisk ? -0.05 : 0;
  const peakGain = clamp(targetGain + levelGainAdjustment + ageGainAdjustment + injuryGainAdjustment, 0.03, 0.35);
  const peakKm = round(startKm * (1 + peakGain));
  let targetKm = startKm;

  if (weekNumber > 1) {
    if (weekPhase === "cutback") {
      targetKm = anchorKm * 0.82;
    } else if (weekPhase === "taper") {
      targetKm = anchorKm * (weekNumber === planWeeks ? 0.72 : 0.85);
    } else if (weekPhase === "short") {
      targetKm = Math.max(startKm, anchorKm * 1.02);
    } else {
      const progress = planWeeks <= 1 ? 1 : (weekNumber - 1) / Math.max(1, planWeeks - 1);
      const plannedGrowth = startKm + (peakKm - startKm) * progress;
      targetKm = Math.max(anchorKm * (1 + cappedGrowth), plannedGrowth);
    }
  }

  targetKm = round(Math.max(startKm * (injuryRisk ? 0.72 : 0.8), targetKm));

  const extraRecoverySlot =
    injuryRisk ||
    weekPhase !== "build" ||
    input.runningLevel === "beginner" ||
    runCount >= 5 ||
    input.age >= 45 ||
    input.maxDurationPerSession < 45;
  const rawMinutes = round(targetKm * basePace);
  const recoveryReserve = extraRecoverySlot ? Math.min(30, input.maxDurationPerSession * 0.35) : 0;
  const minuteCap = round(input.maxDurationPerSession * runCount * 0.92 - recoveryReserve);
  const totalMinutes = Math.max(0, Math.min(rawMinutes, minuteCap));
  const cappedKm = round(totalMinutes / basePace);

  const qualityCount = !injuryRisk && input.runningLevel !== "beginner" && input.targetType !== "general_fitness" ? 1 : 0;

  return {
    weekNumber,
    phase: weekPhase,
    progressionRole,
    progressionExplanation,
    targetKm: cappedKm,
    targetMinutes: totalMinutes,
    runCount,
    qualityCount,
    extraRecoverySlot
  };
}

export function resolvePrimaryQualityType(input: PlanGenerationInput, weekNumber: number) {
  if (input.targetType === "general_fitness") {
    return "tempo";
  }

  if (input.targetType === "5k") {
    return weekNumber % 2 === 0 ? "intervals" : "tempo";
  }

  if (input.targetType === "10k") {
    return weekNumber % 3 === 0 ? "tempo" : "intervals";
  }

  if (input.targetType === "half_marathon") {
    return weekNumber % 2 === 0 ? "tempo" : "intervals";
  }

  return weekNumber % 2 === 0 ? "tempo" : "intervals";
}

export function resolveSecondaryQualityType(input: PlanGenerationInput, weekNumber: number) {
  if (input.targetType === "marathon") {
    return "tempo";
  }

  return resolvePrimaryQualityType(input, weekNumber) === "tempo" ? "intervals" : "tempo";
}

export function workoutPaceMinutesPerKm(input: PlanGenerationInput, type: WorkoutType) {
  const base = determineBasePaceMinutesPerKm(input);
  if (type === "rest") {
    return 0;
  }

  return round(Math.max(4.5, base + TYPE_PACE_ADJUSTMENT[type]));
}

export function targetDurationForDistance(input: PlanGenerationInput, type: WorkoutType, distanceKm: number) {
  if (type === "rest") {
    return 0;
  }

  const pace = workoutPaceMinutesPerKm(input, type);
  const cappedDistance = Math.max(0, distanceKm);
  const duration = round(cappedDistance * pace);
  return Math.min(duration, input.maxDurationPerSession);
}

export function targetDistanceForDuration(input: PlanGenerationInput, type: WorkoutType, targetDuration: number) {
  if (type === "rest" || targetDuration <= 0) {
    return 0;
  }

  const pace = workoutPaceMinutesPerKm(input, type);
  return round(targetDuration / pace);
}

export function workoutEffortLabel(type: WorkoutType) {
  return TYPE_EFFORT[type];
}

export function workoutRpe(type: WorkoutType) {
  return TYPE_RPE[type];
}
