import type {
  AdaptationEvent,
  PlanGenerationInput,
  TrainingPlan,
  UserProfile,
  Workout,
  WorkoutFeedback,
  WorkoutStatus,
  WorkoutType
} from "@/types/runcoach";
import { detectInjuryRisk, targetDistanceForDuration, workoutEffortLabel, workoutRpe } from "@/lib/plan/rules";
import { formatLongDate } from "@/lib/utils/date";

type AdaptationContext = {
  protectiveMode: boolean;
  missedWorkout: boolean;
  hardWorkout: boolean;
  fatigueFlag: boolean;
};

type AdaptationResult = {
  plan: TrainingPlan;
  event: AdaptationEvent;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function workoutTitleForType(type: WorkoutType) {
  switch (type) {
    case "easy_run":
      return "Easy run";
    case "long_run":
      return "Long run";
    case "intervals":
      return "Intervals";
    case "tempo":
      return "Tempo run";
    case "recovery":
      return "Recovery jog";
    case "rest":
    default:
      return "Rest day";
  }
}

function workoutDescription(type: WorkoutType, duration: number, note: string) {
  const durationText = duration > 0 ? `about ${duration} min` : "the day";

  switch (type) {
    case "easy_run":
      return `${note} Keep this relaxed for ${durationText}. Stay conversational and leave energy in reserve.`;
    case "long_run":
      return `${note} Keep this controlled for ${durationText}. No hero pace, no catch-up effort.`;
    case "intervals":
      return `${note} Use ${durationText} for sharper work, but stop well before form gets ragged.`;
    case "tempo":
      return `${note} Hold a steady controlled effort for ${durationText}. It should feel strong, not forced.`;
    case "recovery":
      return `${note} Move lightly for ${durationText}. The goal is to feel better after than before.`;
    case "rest":
    default:
      return `${note} No running today. Let the week absorb properly.`;
  }
}

function saferWorkoutType(type: WorkoutType, profile: UserProfile | null, protectiveMode: boolean) {
  if (type === "rest" || type === "recovery") {
    return type;
  }

  if (type === "long_run") {
    return "long_run";
  }

  if (protectiveMode || profile?.runningLevel === "beginner") {
    return "easy_run";
  }

  if (type === "intervals") {
    return "tempo";
  }

  return "easy_run";
}

function minimumDuration(type: WorkoutType, profile: UserProfile | null) {
  const level = profile?.runningLevel ?? "intermediate";

  if (type === "rest") {
    return 0;
  }

  if (type === "recovery") {
    return level === "beginner" ? 15 : 20;
  }

  if (type === "long_run") {
    return level === "beginner" ? 40 : level === "intermediate" ? 50 : 60;
  }

  if (type === "intervals" || type === "tempo") {
    return level === "beginner" ? 20 : level === "intermediate" ? 28 : 35;
  }

  return level === "beginner" ? 20 : level === "intermediate" ? 25 : 30;
}

function applyDurationReduction(duration: number, reduction: number, minDuration: number) {
  if (duration <= 0) {
    return 0;
  }

  return clamp(Math.round(duration * (1 - reduction)), minDuration, duration);
}

function buildAdaptedWorkout(
  workout: Workout,
  profile: UserProfile | null,
  context: AdaptationContext,
  reduction: number,
  reasonLabel: string,
  adaptedAt: string
) {
  const type = saferWorkoutType(workout.type, profile, context.protectiveMode);
  const nextDuration = applyDurationReduction(workout.targetDuration, reduction, minimumDuration(type, profile));
  const isRest = type === "rest";
  const distanceInput = profileToPlanInput(profile, workout);

  return {
    ...workout,
    type,
    title: workoutTitleForType(type),
    description: workoutDescription(
      type,
      nextDuration,
      reasonLabel
    ),
    targetDuration: isRest ? 0 : nextDuration,
    durationMin: isRest ? 0 : nextDuration,
    targetDistance: isRest ? undefined : round(targetDistanceForDuration(distanceInput, type, nextDuration)),
    distanceKm: isRest ? 0 : round(targetDistanceForDuration(distanceInput, type, nextDuration)),
    targetRpe: workoutRpe(type),
    targetEffort: workoutEffortLabel(type),
    adapted: true,
    adaptationNote: reasonLabel,
    adaptedAt
  } satisfies Workout;
}

function profileToPlanInput(profile: UserProfile | null, workout: Workout): PlanGenerationInput {
  const safeProfile = profile ?? {
    age: 34,
    runningLevel: "intermediate",
    currentWeeklyKm: 20,
    targetType: "general_fitness",
    targetDate: workout.date,
    runsPerWeek: 3,
    maxDurationPerSession: Math.max(30, workout.targetDuration),
    preferredDays: [],
    injuryNotes: ""
  };

  return {
    age: safeProfile.age,
    runningLevel: safeProfile.runningLevel,
    currentWeeklyKm: safeProfile.currentWeeklyKm,
    targetType: safeProfile.targetType,
    targetDate: safeProfile.targetDate,
    runsPerWeek: safeProfile.runsPerWeek,
    maxDurationPerSession: safeProfile.maxDurationPerSession,
    preferredDays: safeProfile.preferredDays,
    injuryNotes: safeProfile.injuryNotes
  };
}

function computeContext(profile: UserProfile | null, feedback: WorkoutFeedback): AdaptationContext {
  const protectiveMode = Boolean(profile?.injuryNotes?.trim()) || detectInjuryRisk(profile?.injuryNotes) || detectInjuryRisk(feedback.notes);
  const missedWorkout = !feedback.completed;
  const hardWorkout = feedback.perceivedDifficulty === "hard" || feedback.perceivedDifficulty === "too_hard";
  const fatigueFlag = feedback.fatigueFlag;

  return {
    protectiveMode,
    missedWorkout,
    hardWorkout,
    fatigueFlag
  };
}

function planStartIndex(weeks: TrainingPlan["weeks"], workoutId: string) {
  for (let weekIndex = 0; weekIndex < weeks.length; weekIndex += 1) {
    const workoutIndex = weeks[weekIndex].workouts.findIndex((workout) => workout.id === workoutId);
    if (workoutIndex !== -1) {
      return { weekIndex, workoutIndex };
    }
  }

  return null;
}

function summarizeChanges(changes: string[], context: AdaptationContext) {
  const reasonParts: string[] = [];

  if (context.missedWorkout) {
    reasonParts.push("the workout was missed");
  }
  if (context.hardWorkout) {
    reasonParts.push("the session felt hard");
  }
  if (context.fatigueFlag) {
    reasonParts.push("fatigue was flagged");
  }
  if (context.protectiveMode) {
    reasonParts.push("protective mode is active");
  }

  const reasonText = reasonParts.length > 0 ? ` because ${reasonParts.join(", ")}` : "";
  const summary = changes.length > 0 ? changes.join(" ") : "No plan changes were needed.";

  return `${summary}${reasonText}.`;
}

function makeChange(workout: Workout, nextWorkout: Workout) {
  return `${formatLongDate(workout.date)}: ${workoutTitleForType(workout.type)} became ${workoutTitleForType(nextWorkout.type).toLowerCase()} (${Math.round(workout.targetDuration)} min -> ${Math.round(
    nextWorkout.targetDuration
  )} min).`;
}

function copyPlan(plan: TrainingPlan): TrainingPlan {
  return {
    ...plan,
    weeks: plan.weeks.map((week) => ({
      ...week,
      workouts: week.workouts.map((workout) => ({ ...workout }))
    }))
  };
}

function recalculateWeekTotals(plan: TrainingPlan) {
  return plan.weeks.map((week) => {
    const totalDurationMin = week.workouts.reduce((sum, workout) => sum + workout.targetDuration, 0);
    const totalKm = week.workouts.reduce((sum, workout) => sum + (workout.targetDistance ?? 0), 0);

    return {
      ...week,
      totalDurationMin: Math.round(totalDurationMin),
      totalKm: round(totalKm)
    };
  });
}

export function applyWorkoutFeedback(
  plan: TrainingPlan,
  profile: UserProfile | null,
  feedback: WorkoutFeedback
): AdaptationResult {
  const nextPlan = copyPlan(plan);
  const context = computeContext(profile, feedback);
  const location = planStartIndex(nextPlan.weeks, feedback.workoutId);

  if (!location) {
    return {
      plan,
      event: {
        id: `adaptation-${feedback.workoutId}-${feedback.submittedAt}`,
        createdAt: feedback.submittedAt,
        title: "Feedback recorded",
        summary: "Feedback was saved, but no matching workout was found to adapt."
      }
    };
  }

  const targetWeek = nextPlan.weeks[location.weekIndex];
  const targetWorkout = targetWeek.workouts[location.workoutIndex];
  const status: WorkoutStatus = feedback.completed ? "completed" : "skipped";

  targetWeek.workouts[location.workoutIndex] = {
    ...targetWorkout,
    status,
    completedAt: feedback.submittedAt,
    notes: feedback.notes,
    effortRating: undefined,
    adapted: false
  };

  const changes: string[] = [];
  const baseReduction = context.protectiveMode ? 0.22 : context.hardWorkout ? 0.15 : context.missedWorkout ? 0.1 : 0.05;
  const fatigueReduction = context.fatigueFlag ? 0.12 : 0;
  const totalReduction = clamp(baseReduction + fatigueReduction, 0.05, 0.35);

  const applyToWorkout = (workout: Workout, reduction: number, label: string, forceRest?: boolean) => {
    const nextWorkout = forceRest
      ? {
          ...workout,
          type: "rest" as WorkoutType,
          title: "Rest day",
          description: `${label} No running today. This is a deliberate recovery choice.`,
          targetDuration: 0,
          durationMin: 0,
          targetDistance: undefined,
          distanceKm: 0,
          targetRpe: 1,
          targetEffort: "Off",
          purpose: "Protect recovery and avoid catch-up overload.",
          adapted: true,
          adaptationNote: label,
          adaptedAt: feedback.submittedAt,
          status: workout.status === "planned" ? "planned" : workout.status
        }
      : buildAdaptedWorkout(workout, profile, context, reduction, label, feedback.submittedAt);

    changes.push(makeChange(workout, nextWorkout));
    return nextWorkout;
  };

  for (let weekIndex = location.weekIndex; weekIndex < nextPlan.weeks.length; weekIndex += 1) {
    const week = nextPlan.weeks[weekIndex];
    const isCurrentWeek = weekIndex === location.weekIndex;

    week.workouts = week.workouts.map((workout, workoutIndex) => {
      if (weekIndex === location.weekIndex && workoutIndex <= location.workoutIndex) {
        return workout;
      }

      if (workout.type === "rest") {
        return workout;
      }

      const sameWeekReduction = isCurrentWeek ? totalReduction + (context.fatigueFlag ? 0.05 : 0) : totalReduction * 0.75;
      const reduction = clamp(sameWeekReduction, 0.05, 0.35);
      const shouldGoToRest =
        context.protectiveMode &&
        profile?.runningLevel === "beginner" &&
        (workout.type === "intervals" || workout.type === "tempo") &&
        (isCurrentWeek || weekIndex === location.weekIndex + 1);

      if (shouldGoToRest) {
        return applyToWorkout(workout, reduction, "Protective mode lowered this session further.", true);
      }

      return applyToWorkout(
        workout,
        reduction,
        context.protectiveMode
          ? "Protective mode softened the upcoming training."
          : context.fatigueFlag
            ? "Fatigue from this week lowered the rest of the load."
            : context.hardWorkout
              ? "The upcoming workload was trimmed after a hard session."
              : "The upcoming workload was kept conservative."
      );
    });
  }

  nextPlan.weeks = recalculateWeekTotals(nextPlan);
  nextPlan.updatedAt = feedback.submittedAt;

  const eventSummary = summarizeChanges(changes.slice(0, 4), context);

  return {
    plan: nextPlan,
    event: {
      id: `adaptation-${feedback.workoutId}-${feedback.submittedAt}`,
      createdAt: feedback.submittedAt,
      title: "Plan adapted",
      summary: eventSummary,
      changes: changes.slice(0, 4)
    }
  };
}
