import type {
  PlanGenerationInput,
  ReadinessRecommendation,
  SleepQuality,
  FatigueLevel,
  SorenessLevel,
  StressLevel,
  Workout,
  WorkoutReadinessCheck,
  WorkoutReadinessInput,
  UserProfile,
  WorkoutType
} from "@/types/runcoach";
import { targetDistanceForDuration, workoutEffortLabel, workoutRpe } from "@/lib/plan/rules";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function sleepPoints(value: SleepQuality) {
  switch (value) {
    case "good":
      return 30;
    case "ok":
      return 18;
    case "poor":
    default:
      return 0;
  }
}

function fatiguePoints(value: FatigueLevel) {
  switch (value) {
    case "low":
      return 28;
    case "medium":
      return 14;
    case "high":
    default:
      return 0;
  }
}

function sorenessPoints(value: SorenessLevel) {
  switch (value) {
    case "none":
      return 30;
    case "light":
      return 16;
    case "moderate":
      return 4;
    case "high":
    default:
      return 0;
  }
}

function stressPoints(value: StressLevel) {
  switch (value) {
    case "low":
      return 18;
    case "medium":
      return 9;
    case "high":
    default:
      return 0;
  }
}

function buildExplanation(input: WorkoutReadinessInput, score: number, recommendation: ReadinessRecommendation) {
  if (recommendation === "ready") {
    return "Readiness looks good today. Run as planned.";
  }

  if (recommendation === "protect") {
    if (input.sorenessLevel === "high") {
      return "Protected the session because soreness was reported high.";
    }

    return "Protected the session because readiness is low today.";
  }

  if (input.fatigueLevel === "high" && input.sleepQuality === "poor") {
    return "Reduced duration today because sleep quality and fatigue were both low.";
  }

  if (input.fatigueLevel === "high") {
    return "Reduced duration today because fatigue was reported high.";
  }

  if (input.sleepQuality === "poor") {
    return "Reduced duration today because sleep quality was poor.";
  }

  if (input.stressLevel === "high") {
    return "Reduced duration today because stress is high.";
  }

  return score >= 45 ? "Reduced duration today to keep the session controlled." : "Protected the session to keep the week absorbable.";
}

function chooseRecommendation(input: WorkoutReadinessInput, score: number): ReadinessRecommendation {
  if (input.sorenessLevel === "high") {
    return "protect";
  }

  if (input.sleepQuality === "poor" && input.fatigueLevel === "high") {
    return "caution";
  }

  if (input.stressLevel === "high" && score < 85) {
    return "caution";
  }

  if (score >= 70) {
    return "ready";
  }

  if (score >= 45) {
    return "caution";
  }

  return "protect";
}

function chooseProtectiveType(workout: Workout, score: number): WorkoutType {
  if (score < 20 || workout.type === "long_run" || workout.type === "intervals" || workout.type === "tempo") {
    return "rest";
  }

  return "easy_run";
}

function chooseCautionReduction(score: number) {
  return score >= 60 ? 0.1 : 0.2;
}

export function evaluateWorkoutReadiness(input: WorkoutReadinessInput): WorkoutReadinessCheck {
  const score = clamp(
    sleepPoints(input.sleepQuality) + fatiguePoints(input.fatigueLevel) + sorenessPoints(input.sorenessLevel) + stressPoints(input.stressLevel),
    0,
    100
  );
  const recommendation = chooseRecommendation(input, score);

  return {
    workoutId: input.workoutId,
    sleepQuality: input.sleepQuality,
    fatigueLevel: input.fatigueLevel,
    sorenessLevel: input.sorenessLevel,
    stressLevel: input.stressLevel,
    submittedAt: input.submittedAt,
    score,
    recommendation,
    coachExplanation: buildExplanation(input, score, recommendation),
    adjustedWorkoutType: "easy_run",
    adjustedDurationMin: 0
  };
}

export function applyWorkoutReadiness(
  workout: Workout,
  input: WorkoutReadinessInput,
  profile: UserProfile | null
) {
  const readiness = evaluateWorkoutReadiness(input);
  const score = readiness.score;
  const recommendation = readiness.recommendation;
  const distanceInput: PlanGenerationInput = {
    age: profile?.age ?? 34,
    runningLevel: profile?.runningLevel ?? "intermediate",
    currentWeeklyKm: profile?.currentWeeklyKm ?? 20,
    targetType: profile?.targetType ?? "general_fitness",
    targetDate: profile?.targetDate ?? workout.date,
    runsPerWeek: profile?.runsPerWeek ?? 3,
    maxDurationPerSession: profile?.maxDurationPerSession ?? Math.max(30, workout.targetDuration),
    preferredDays: profile?.preferredDays ?? [],
    injuryNotes: profile?.injuryNotes ?? ""
  };

  if (recommendation === "ready") {
    return {
      workout: {
        ...workout,
        readinessCheck: {
          ...readiness,
          adjustedWorkoutType: workout.type,
          adjustedDurationMin: workout.targetDuration,
          adjustedDistanceKm: workout.targetDistance
        },
        adapted: false,
        adaptationNote: "Readiness check completed. Run as planned."
      } satisfies Workout,
      readiness: {
        ...readiness,
        adjustedWorkoutType: workout.type,
        adjustedDurationMin: workout.targetDuration,
        adjustedDistanceKm: workout.targetDistance
      }
    };
  }

  if (recommendation === "caution") {
    const reduction = chooseCautionReduction(score);
    const adjustedDurationMin = Math.max(10, Math.round(workout.targetDuration * (1 - reduction)));
    const adjustedDistanceKm = round(targetDistanceForDuration(distanceInput, workout.type, adjustedDurationMin));

    return {
      workout: {
        ...workout,
        targetDuration: adjustedDurationMin,
        durationMin: adjustedDurationMin,
        targetDistance: adjustedDistanceKm,
        distanceKm: adjustedDistanceKm,
        targetRpe: workoutRpe(workout.type),
        targetEffort: workoutEffortLabel(workout.type),
        adapted: true,
        adaptationNote: readiness.coachExplanation,
        adaptedAt: input.submittedAt,
        readinessCheck: {
          ...readiness,
          adjustedWorkoutType: workout.type,
          adjustedDurationMin,
          adjustedDistanceKm
        }
      } satisfies Workout,
      readiness: {
        ...readiness,
        adjustedWorkoutType: workout.type,
        adjustedDurationMin,
        adjustedDistanceKm
      }
    };
  }

  const adjustedWorkoutType = chooseProtectiveType(workout, score);
  const adjustedDurationMin = adjustedWorkoutType === "rest" ? 0 : Math.max(20, Math.round(workout.targetDuration * 0.8));
  const adjustedDistanceKm = adjustedWorkoutType === "rest" ? undefined : round(targetDistanceForDuration(distanceInput, adjustedWorkoutType, adjustedDurationMin));

  return {
    workout: {
      ...workout,
      type: adjustedWorkoutType,
      title:
        adjustedWorkoutType === "rest"
          ? "Rest day"
          : adjustedWorkoutType === "easy_run"
            ? "Easy run"
            : workout.title,
      description:
        adjustedWorkoutType === "rest"
          ? "No running today. Protect the session and come back fresh."
          : "This session has been softened based on your readiness check.",
      targetDuration: adjustedDurationMin,
      durationMin: adjustedDurationMin,
      targetDistance: adjustedDistanceKm,
      distanceKm: adjustedDistanceKm ?? 0,
      targetRpe: workoutRpe(adjustedWorkoutType),
      targetEffort: workoutEffortLabel(adjustedWorkoutType),
      adapted: true,
      adaptationNote: readiness.coachExplanation,
      adaptedAt: input.submittedAt,
      readinessCheck: {
        ...readiness,
        adjustedWorkoutType,
        adjustedDurationMin,
        adjustedDistanceKm
      }
    } satisfies Workout,
    readiness: {
      ...readiness,
      adjustedWorkoutType,
      adjustedDurationMin,
      adjustedDistanceKm
    }
  };
}
