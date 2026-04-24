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
  race: -0.2,
  rest: 0
};

const TYPE_RPE: Record<WorkoutType, number> = {
  easy_run: 3,
  long_run: 5,
  intervals: 8,
  tempo: 7,
  recovery: 2,
  race: 8,
  rest: 1
};

const TYPE_EFFORT: Record<WorkoutType, string> = {
  easy_run: "Easy, conversational",
  long_run: "Easy to moderate",
  intervals: "Hard but controlled",
  tempo: "Comfortably hard",
  recovery: "Very easy",
  race: "Race effort",
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

export function getRaceDistanceKm(targetType: TargetType) {
  switch (targetType) {
    case "5k":
      return 5;
    case "10k":
      return 10;
    case "half_marathon":
      return 21.1;
    case "marathon":
      return 42.2;
    case "general_fitness":
    default:
      return 0;
  }
}

export function getRaceWorkoutTitle(targetType: TargetType) {
  switch (targetType) {
    case "5k":
      return "5K race";
    case "10k":
      return "10K race";
    case "half_marathon":
      return "Half marathon race";
    case "marathon":
      return "Marathon race";
    case "general_fitness":
    default:
      return "Race day";
  }
}

export function getRaceWorkoutPurpose(targetType: TargetType) {
  switch (targetType) {
    case "5k":
      return "This is the target event. Run the 5K at a controlled race effort and let the plan end here.";
    case "10k":
      return "This is the target event. Run the 10K at a controlled race effort and let the plan end here.";
    case "half_marathon":
      return "This is the target event. Run the half marathon at a controlled race effort and let the plan end here.";
    case "marathon":
      return "This is the target event. Run the marathon at a controlled race effort and let the plan end here.";
    case "general_fitness":
    default:
      return "This session closes the plan with a simple target-day effort.";
  }
}

export function getRaceWorkoutDescription(targetType: TargetType) {
  switch (targetType) {
    case "5k":
      return "This is the target race day. Warm up well, run the 5K, and treat this as the final workout of the plan.";
    case "10k":
      return "This is the target race day. Warm up well, run the 10K, and treat this as the final workout of the plan.";
    case "half_marathon":
      return "This is the target race day. Warm up well, run the half marathon, and treat this as the final workout of the plan.";
    case "marathon":
      return "This is the target race day. Warm up well, run the marathon, and treat this as the final workout of the plan.";
    case "general_fitness":
    default:
      return "This is the final session of the block. Keep it simple and complete the plan cleanly.";
  }
}

export function getRaceWorkoutPaceMinutesPerKm(input: PlanGenerationInput) {
  const base = determineBasePaceMinutesPerKm(input);
  const adjustment =
    input.targetType === "5k"
      ? -0.55
      : input.targetType === "10k"
        ? -0.4
        : input.targetType === "half_marathon"
          ? -0.28
          : input.targetType === "marathon"
            ? -0.12
            : -0.08;

  return round(Math.max(3.5, base + adjustment));
}

export function getRaceWorkoutDuration(input: PlanGenerationInput) {
  const distance = getRaceDistanceKm(input.targetType);
  if (distance <= 0) {
    return 0;
  }

  return Math.max(0, Math.round(distance * getRaceWorkoutPaceMinutesPerKm(input)));
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
  const raceGoal = input.targetType !== "general_fitness";
  const weekPhase = raceGoal
    ? weekNumber === planWeeks
      ? "taper"
      : weekNumber > 1 && weekNumber % 4 === 0 && planWeeks > 4
        ? "cutback"
        : "build"
    : weekNumber > planWeeks - 2
      ? "taper"
      : weekNumber > 1 && weekNumber % 4 === 0 && planWeeks > 4
        ? "cutback"
        : planWeeks <= 3
          ? "short"
          : "build";
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
        ? 0.3
        : input.targetType === "half_marathon"
          ? 0.24
          : input.targetType === "10k"
            ? 0.16
            : input.targetType === "5k"
              ? 0.1
              : 0.08;
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

  const qualityCount = resolveGoalQualityCount(input, weekNumber, planWeeks, weekPhase);

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

  if (type === "race") {
    return getRaceWorkoutDuration(input);
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

  if (type === "race") {
    return getRaceDistanceKm(input.targetType);
  }

  const pace = workoutPaceMinutesPerKm(input, type);
  return round(targetDuration / pace);
}

export interface GoalLongRunBounds {
  floorKm: number;
  peakKm: number;
  weeklyShare: number;
}

export function resolveGoalLongRunBounds(input: PlanGenerationInput): GoalLongRunBounds {
  switch (input.targetType) {
    case "5k":
      return {
        floorKm: input.runningLevel === "beginner" ? 6 : input.runningLevel === "intermediate" ? 7 : 8,
        peakKm: input.runningLevel === "beginner" ? 7 : input.runningLevel === "intermediate" ? 8.5 : 9.5,
        weeklyShare: input.runningLevel === "beginner" ? 0.32 : 0.34
      };
    case "10k":
      return {
        floorKm: input.runningLevel === "beginner" ? 7 : input.runningLevel === "intermediate" ? 9 : 10,
        peakKm: input.runningLevel === "beginner" ? 10 : input.runningLevel === "intermediate" ? 12.5 : 13.5,
        weeklyShare: input.runningLevel === "beginner" ? 0.36 : 0.4
      };
    case "half_marathon":
      return {
        floorKm: input.runningLevel === "beginner" ? 10 : input.runningLevel === "intermediate" ? 11 : 13,
        peakKm: input.runningLevel === "beginner" ? 13 : input.runningLevel === "intermediate" ? 17 : 18,
        weeklyShare: input.runningLevel === "beginner" ? 0.44 : 0.48
      };
    case "marathon":
      return {
        floorKm: input.runningLevel === "beginner" ? 14 : input.runningLevel === "intermediate" ? 16 : 18,
        peakKm: input.runningLevel === "beginner" ? 18 : input.runningLevel === "intermediate" ? 24 : 28,
        weeklyShare: input.runningLevel === "beginner" ? 0.46 : 0.5
      };
    case "general_fitness":
    default:
      return {
        floorKm: input.runningLevel === "beginner" ? 5 : input.runningLevel === "intermediate" ? 6.5 : 7.5,
        peakKm: input.runningLevel === "beginner" ? 7 : input.runningLevel === "intermediate" ? 9 : 10,
        weeklyShare: input.runningLevel === "beginner" ? 0.28 : 0.3
      };
  }
}

export function resolveGoalLongRunKm(input: PlanGenerationInput, targetKm: number, phase: WeekPhase) {
  const bounds = resolveGoalLongRunBounds(input);
  const phaseMultiplier = phase === "cutback" ? 0.85 : phase === "taper" ? 0.8 : phase === "short" ? 0.9 : 1;
  const distance = round(targetKm * bounds.weeklyShare * phaseMultiplier);
  return clamp(distance, bounds.floorKm * phaseMultiplier, bounds.peakKm);
}

export function resolveGoalQualityCount(input: PlanGenerationInput, weekNumber: number, planWeeks: number, phase: WeekPhase) {
  const runCount = Math.max(1, Math.round(input.runsPerWeek));
  if (phase !== "build" || runCount < 2) {
    return 0;
  }

  if (input.runningLevel === "beginner") {
    if (input.targetType === "general_fitness" || input.targetType === "5k") {
      return 0;
    }

    return weekNumber % 3 === 0 ? 1 : 0;
  }

  if (input.runningLevel === "advanced" && runCount >= 5 && planWeeks >= 8 && (input.targetType === "10k" || input.targetType === "half_marathon" || input.targetType === "marathon")) {
    return weekNumber % 4 === 2 ? 2 : 1;
  }

  if (input.targetType === "general_fitness") {
    return 1;
  }

  return 1;
}

export function resolveWorkoutWeight(type: WorkoutType, input: PlanGenerationInput) {
  if (type === "rest") {
    return 0;
  }

  if (type === "race") {
    return 1.1;
  }

  const weights: Record<PlanGenerationInput["targetType"], Record<WorkoutType, number>> = {
    "5k": {
      easy_run: 1,
      long_run: input.runningLevel === "beginner" ? 1.35 : input.runningLevel === "intermediate" ? 1.45 : 1.55,
      intervals: input.runningLevel === "beginner" ? 1.08 : 1.18,
      tempo: input.runningLevel === "beginner" ? 1.02 : 1.08,
      recovery: 0.72,
      race: 1.1,
      rest: 0
    },
    "10k": {
      easy_run: 1,
      long_run: input.runningLevel === "beginner" ? 1.65 : input.runningLevel === "intermediate" ? 1.8 : 1.9,
      intervals: input.runningLevel === "beginner" ? 1.02 : 1.1,
      tempo: input.runningLevel === "beginner" ? 1.08 : 1.15,
      recovery: 0.72,
      race: 1.1,
      rest: 0
    },
    half_marathon: {
      easy_run: 1,
      long_run: input.runningLevel === "beginner" ? 2.1 : input.runningLevel === "intermediate" ? 2.35 : 2.5,
      intervals: input.runningLevel === "beginner" ? 1.0 : 1.05,
      tempo: input.runningLevel === "beginner" ? 1.1 : 1.18,
      recovery: 0.72,
      race: 1.1,
      rest: 0
    },
    marathon: {
      easy_run: 1,
      long_run: input.runningLevel === "beginner" ? 2.35 : input.runningLevel === "intermediate" ? 2.6 : 2.8,
      intervals: input.runningLevel === "beginner" ? 0.95 : 1.0,
      tempo: input.runningLevel === "beginner" ? 1.08 : 1.15,
      recovery: 0.72,
      race: 1.1,
      rest: 0
    },
    general_fitness: {
      easy_run: 1,
      long_run: input.runningLevel === "beginner" ? 1.15 : input.runningLevel === "intermediate" ? 1.25 : 1.3,
      intervals: input.runningLevel === "beginner" ? 0.9 : 0.95,
      tempo: input.runningLevel === "beginner" ? 1.0 : 1.05,
      recovery: 0.72,
      race: 1.1,
      rest: 0
    }
  };

  return weights[input.targetType][type];
}

export function resolveWorkoutTitle(type: WorkoutType, input: PlanGenerationInput, weekNumber: number, qualityIndex: number) {
  if (type === "easy_run") {
    if (input.targetType === "5k") {
      return weekNumber === 1 ? "Easy run + strides" : "Easy run with strides";
    }

    if (input.targetType === "10k") {
      return "Aerobic easy run";
    }

    if (input.targetType === "half_marathon") {
      return "Aerobic endurance run";
    }

    if (input.targetType === "marathon") {
      return "Marathon easy run";
    }

    return "Easy run";
  }

  if (type === "long_run") {
    if (input.targetType === "5k") {
      return "Endurance long run";
    }

    if (input.targetType === "10k") {
      return "Long run";
    }

    if (input.targetType === "half_marathon") {
      return "Half marathon long run";
    }

    if (input.targetType === "marathon") {
      return "Marathon long run";
    }

    return "Long aerobic run";
  }

  if (type === "recovery") {
    return "Recovery jog";
  }

  if (type === "rest") {
    return "Rest day";
  }

  if (type === "race") {
    return getRaceWorkoutTitle(input.targetType);
  }

  if (type === "tempo") {
    if (input.targetType === "general_fitness") {
      return "Steady progression";
    }

    if (input.targetType === "marathon") {
      return qualityIndex === 0 ? "Marathon tempo" : "Marathon support tempo";
    }

    if (input.targetType === "half_marathon") {
      return qualityIndex === 0 ? "Threshold tempo" : "Tempo support";
    }

    if (input.targetType === "10k") {
      return qualityIndex === 0 ? "10K tempo" : "Threshold tempo";
    }

    return qualityIndex === 0 ? "Tempo run" : "Tempo support";
  }

  if (input.targetType === "5k") {
    return qualityIndex === 0 ? "5K intervals" : "Speed intervals";
  }

  if (input.targetType === "10k") {
    return qualityIndex === 0 ? "10K intervals" : "Threshold intervals";
  }

  if (input.targetType === "half_marathon") {
    return qualityIndex === 0 ? "Cruise intervals" : "Tempo intervals";
  }

  if (input.targetType === "marathon") {
    return qualityIndex === 0 ? "Marathon intervals" : "Marathon support";
  }

  return qualityIndex === 0 ? "Quality session" : "Support session";
}

export function resolveWorkoutPurpose(type: WorkoutType, input: PlanGenerationInput, phase: WeekPhase) {
  if (type === "rest") {
    return "Protect recovery and keep the week absorbable.";
  }

  if (type === "race") {
    return getRaceWorkoutPurpose(input.targetType);
  }

  if (type === "recovery") {
    return phase === "taper" ? "Freshen up before race week." : "Clear fatigue without adding stress.";
  }

  if (type === "easy_run") {
    if (input.targetType === "5k") {
      return "Build aerobic consistency and leave room for short strides.";
    }

    if (input.targetType === "10k") {
      return "Build the aerobic base that supports threshold work.";
    }

    if (input.targetType === "half_marathon") {
      return "Add durable easy volume between longer efforts.";
    }

    if (input.targetType === "marathon") {
      return "Keep the volume moving without adding fatigue.";
    }

    return "Build aerobic consistency at a controlled effort.";
  }

  if (type === "long_run") {
    if (input.targetType === "5k") {
      return "Give you just enough endurance for faster sessions without overloading the week.";
    }

    if (input.targetType === "10k") {
      return "Build the longer aerobic base that supports race-specific endurance.";
    }

    if (input.targetType === "half_marathon") {
      return "Extend endurance toward half marathon durability.";
    }

    if (input.targetType === "marathon") {
      return "Build marathon durability and fatigue resistance.";
    }

    return "Raise endurance gradually without a sudden jump in load.";
  }

  if (type === "tempo") {
    if (input.targetType === "general_fitness") {
      return "Add a steady aerobic stimulus without overcomplicating the week.";
    }

    if (input.targetType === "marathon") {
      return "Practice sustainable rhythm and efficient effort for longer running.";
    }

    if (input.targetType === "half_marathon") {
      return "Raise threshold strength for stronger race-day stamina.";
    }

    if (input.targetType === "10k") {
      return "Blend speed and endurance at a sustainable hard effort.";
    }

    return "Practice sustained controlled effort near threshold.";
  }

  if (input.targetType === "5k") {
    return "Improve turnover and speed with controlled effort.";
  }

  if (input.targetType === "10k") {
    return "Develop race-specific control and sustainable speed.";
  }

  if (input.targetType === "half_marathon") {
    return "Support race-specific stamina and threshold strength.";
  }

  if (input.targetType === "marathon") {
    return "Develop marathon-specific rhythm and fatigue resistance.";
  }

  return "Maintain fitness with a small quality stimulus.";
}

export function resolveWorkoutDescription(
  type: WorkoutType,
  input: PlanGenerationInput,
  phase: WeekPhase,
  targetDuration: number,
  qualityIndex: number
) {
  const durationText = `${targetDuration} min`;

  if (type === "rest") {
    return "No running today. Keep the day truly easy and let the training absorb.";
  }

  if (type === "race") {
    return getRaceWorkoutDescription(input.targetType);
  }

  if (type === "recovery") {
    return `Move lightly for ${durationText}. The goal is to feel fresher tomorrow than you do today.`;
  }

  if (type === "easy_run") {
    if (input.targetType === "5k") {
      return `Keep this relaxed for about ${durationText}. Run conversationally and finish with 4 to 6 short strides if you feel smooth.`;
    }

    if (input.targetType === "10k") {
      return `Run relaxed for about ${durationText}. Stay aerobic and save your focus for the quality session.`;
    }

    if (input.targetType === "half_marathon") {
      return `Run relaxed for about ${durationText}. Keep the effort easy so the long run and threshold work stay productive.`;
    }

    if (input.targetType === "marathon") {
      return `Run relaxed for about ${durationText}. This is durability work, not pace work.`;
    }

    return `Run relaxed for about ${durationText}. Keep the effort conversational and repeatable.`;
  }

  if (type === "long_run") {
    const goalHint =
      input.targetType === "5k"
        ? "This is the aerobic base that supports faster running."
        : input.targetType === "10k"
          ? "This is the key endurance anchor for the week."
          : input.targetType === "half_marathon"
            ? "Keep the first half very controlled and let endurance build naturally."
            : input.targetType === "marathon"
              ? "This is the most important durability workout of the week."
              : "Stay smooth and finish feeling better than you started.";

    return `Spend about ${durationText} on a steady easy effort. ${goalHint} The cap is set from your current profile, not a generic mileage jump.`;
  }

  if (type === "tempo") {
    const targetHint =
      input.targetType === "general_fitness"
        ? "Stay comfortably strong, not strained."
        : input.targetType === "marathon"
          ? "Hold a sustainable rhythm without drifting too hard."
          : input.targetType === "half_marathon"
            ? "Hold a controlled threshold effort."
            : input.targetType === "10k"
              ? "Hold a controlled threshold effort."
              : "Keep the reps sharp but under control.";

    const sessionLabel = qualityIndex > 0 ? "secondary quality session" : "main quality session";
    return `Include a warm-up and then hold tempo work inside about ${durationText}. ${targetHint} This is the ${sessionLabel} for the week.`;
  }

  const repStyle =
    input.targetType === "5k"
      ? "short controlled reps with full recovery"
      : input.targetType === "10k"
        ? "moderate reps with steady recoveries"
        : input.targetType === "half_marathon"
          ? "cruise-style reps near threshold"
          : input.targetType === "marathon"
            ? "marathon-specific rhythm blocks"
            : "controlled fartlek blocks";

  const phaseHint = phase === "taper" ? "Keep the effort snappy but leave a little in reserve." : "Stop before the workout turns ragged.";

  const sessionLabel = qualityIndex > 0 ? "support quality session" : "main quality session";
  return `Use about ${durationText} for ${repStyle}. This is the ${sessionLabel} for the week. ${phaseHint} It is sized to fit your weekly load and session limit.`;
}

export function buildGoalCoachNotes(input: PlanGenerationInput, totalWeeks: number, peakLongRunKm: number, actualPeakLongRunKm?: number) {
  const notes: string[] = [];

  if (input.targetType === "general_fitness") {
    notes.push("This plan stays simple and sustainable: mostly easy running with only a small quality touch when safe.");
  }

  if (input.targetType === "5k") {
    notes.push("5K plans keep the long run modest and use short quality work only when the week has room for it.");
  }

  if (input.targetType === "10k") {
    notes.push("10K plans blend endurance and threshold work so you build race-specific stamina without excessive mileage.");
  }

  if (input.targetType === "half_marathon") {
    if (totalWeeks <= 6 || input.currentWeeklyKm < 25 || peakLongRunKm < 11) {
      notes.push("This is a short half marathon build, so the plan prioritizes safe long-run progression over aggressive mileage.");
    } else {
      notes.push("Half marathon plans prioritize long-run progression, threshold work, and conservative endurance gains.");
    }

    if (typeof actualPeakLongRunKm === "number" && actualPeakLongRunKm > 0 && actualPeakLongRunKm < 12) {
      notes.push("Your max session duration limits the half marathon peak long run, so the plan stays shorter than an ideal race build.");
    }
  }

  if (input.targetType === "marathon") {
    if (totalWeeks <= 12 || input.currentWeeklyKm < 40 || peakLongRunKm < 14) {
      notes.push("Your marathon target is close relative to your current weekly volume. This plan is conservative and may not fully prepare you for peak marathon demands.");
    } else {
      notes.push("Marathon plans emphasize long-run progression, weekly durability, and careful fatigue management.");
    }

    if (typeof actualPeakLongRunKm === "number" && actualPeakLongRunKm > 0 && actualPeakLongRunKm < 18) {
      notes.push("Your max session duration limits marathon long-run progression, so the peak run stays below an ideal marathon build.");
    }
  }

  if (detectInjuryRisk(input.injuryNotes)) {
    notes.push("Injury notes were detected, so the plan keeps intensity conservative and avoids aggressive workouts.");
  }

  return notes;
}

export function workoutEffortLabel(type: WorkoutType) {
  return TYPE_EFFORT[type];
}

export function workoutRpe(type: WorkoutType) {
  return TYPE_RPE[type];
}
