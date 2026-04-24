import type { PlanGenerationInput, TrainingPlan, WorkoutType } from "@/types/runcoach";
import { toDateKey } from "@/lib/utils/date";

export interface TrainingPlanValidationScenario {
  name: string;
  input: PlanGenerationInput;
  expectations: {
    minLongRunKm?: number;
    maxQualitySessions?: number;
    minBuildWeeks?: number;
    notes?: string;
  };
}

export const TRAINING_PLAN_VALIDATION_SCENARIOS: TrainingPlanValidationScenario[] = [
  {
    name: "Beginner 5K, 2 runs/week, 6 weeks",
    input: {
      age: 28,
      runningLevel: "beginner",
      currentWeeklyKm: 8,
      targetType: "5k",
      targetDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString(),
      runsPerWeek: 2,
      maxDurationPerSession: 45,
      preferredDays: [2, 6],
      injuryNotes: ""
    },
    expectations: {
      minLongRunKm: 6,
      maxQualitySessions: 0,
      notes: "Mostly easy running with optional light strides."
    }
  },
  {
    name: "Intermediate 10K, 3 runs/week, 8 weeks",
    input: {
      age: 34,
      runningLevel: "intermediate",
      currentWeeklyKm: 24,
      targetType: "10k",
      targetDate: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000).toISOString(),
      runsPerWeek: 3,
      maxDurationPerSession: 70,
      preferredDays: [1, 3, 6],
      injuryNotes: ""
    },
    expectations: {
      minLongRunKm: 9,
      maxQualitySessions: 1,
      notes: "One quality session plus a meaningful long run."
    }
  },
  {
    name: "Intermediate half marathon, 20 km/week, 3 runs/week, 8 weeks",
    input: {
      age: 36,
      runningLevel: "intermediate",
      currentWeeklyKm: 20,
      targetType: "half_marathon",
      targetDate: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000).toISOString(),
      runsPerWeek: 3,
      maxDurationPerSession: 80,
      preferredDays: [1, 4, 6],
      injuryNotes: ""
    },
    expectations: {
      minLongRunKm: 12,
      maxQualitySessions: 1,
      notes: "At least one build week should exceed 10 km on the long run."
    }
  },
  {
    name: "Advanced half marathon, 40 km/week, 4 runs/week, 10 weeks",
    input: {
      age: 41,
      runningLevel: "advanced",
      currentWeeklyKm: 40,
      targetType: "half_marathon",
      targetDate: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString(),
      runsPerWeek: 4,
      maxDurationPerSession: 100,
      preferredDays: [1, 3, 5, 6],
      injuryNotes: ""
    },
    expectations: {
      minLongRunKm: 14,
      maxQualitySessions: 2,
      notes: "Long-run progression should be clear and conservative."
    }
  },
  {
    name: "Intermediate marathon, 35 km/week, 4 runs/week, 12 weeks",
    input: {
      age: 38,
      runningLevel: "intermediate",
      currentWeeklyKm: 35,
      targetType: "marathon",
      targetDate: new Date(Date.now() + 84 * 24 * 60 * 60 * 1000).toISOString(),
      runsPerWeek: 4,
      maxDurationPerSession: 120,
      preferredDays: [1, 3, 5, 6],
      injuryNotes: ""
    },
    expectations: {
      minLongRunKm: 16,
      maxQualitySessions: 2,
      notes: "Weekly long-run progression should be marathon-specific."
    }
  },
  {
    name: "Beginner general fitness, 2 runs/week",
    input: {
      age: 30,
      runningLevel: "beginner",
      currentWeeklyKm: 6,
      targetType: "general_fitness",
      targetDate: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000).toISOString(),
      runsPerWeek: 2,
      maxDurationPerSession: 40,
      preferredDays: [2, 6],
      injuryNotes: ""
    },
    expectations: {
      minLongRunKm: 5,
      maxQualitySessions: 0,
      notes: "Simple sustainable easy-running block."
    }
  }
];

export function validateGeneratedTrainingPlan(plan: TrainingPlan, input: PlanGenerationInput) {
  const issues: string[] = [];
  const targetDateKey = toDateKey(input.targetDate);

  const runCountExceeded = plan.weeks.some((week) => week.workouts.filter((workout) => workout.type !== "rest").length > input.runsPerWeek);
  if (runCountExceeded) {
    issues.push("A week exceeds the requested runs per week.");
  }

  const beforeStart = plan.weeks.some((week) =>
    week.workouts.some((workout) => new Date(workout.date).getTime() < new Date(plan.startDate).getTime())
  );
  if (beforeStart) {
    issues.push("A workout was scheduled before the plan start date.");
  }

  if (input.targetType !== "general_fitness") {
    const raceWeek = plan.weeks.find((week) => week.workouts.some((workout) => toDateKey(workout.date) === targetDateKey));
    const raceWorkout = plan.weeks.flatMap((week) => week.workouts).find((workout) => workout.type === "race");

    if (!raceWorkout) {
      issues.push("A race workout was not generated for the target date.");
    } else if (toDateKey(raceWorkout.date) !== targetDateKey) {
      issues.push("The race workout is not scheduled on the target date.");
    }

    const workoutsAfterTarget = plan.weeks.some((week) =>
      week.workouts.some((workout) => toDateKey(workout.date) > targetDateKey)
    );
    if (workoutsAfterTarget) {
      issues.push("A workout was scheduled after the target race date.");
    }

    if (!raceWeek) {
      issues.push("The final week does not include the race date.");
    } else {
      const sortedRaceWeek = [...raceWeek.workouts].sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());
      const raceIndex = sortedRaceWeek.findIndex((workout) => workout.type === "race");
      if (raceIndex === -1) {
        issues.push("The final week does not contain the target race workout.");
      } else {
        const preRaceWorkouts = sortedRaceWeek.slice(0, raceIndex);
        const invalidFinalWeekWorkout = preRaceWorkouts.some(
          (workout) => workout.type === "tempo" || workout.type === "intervals" || workout.type === "long_run"
        );
        if (invalidFinalWeekWorkout) {
          issues.push("The final week contains a hard workout before the race.");
        }

        const nonEasyFinalWeekWorkout = preRaceWorkouts.some((workout) => workout.type !== "easy_run");
        if (nonEasyFinalWeekWorkout) {
          issues.push("The final week contains a non-easy workout before the race.");
        }

        if (sortedRaceWeek[raceIndex + 1]) {
          issues.push("The race workout is not the final workout of the plan.");
        }
      }
    }
  }

  const preferredDays = [...new Set(input.preferredDays)].sort((left, right) => left - right);
  if (preferredDays.length > 0) {
    const invalidDay = plan.weeks.some((week) =>
      week.workouts.some((workout) => !preferredDays.includes(new Date(workout.date).getDay()))
    );
    if (invalidDay) {
      issues.push("A workout was scheduled on a non-preferred day.");
    }
  }

  const longRunTypeCount = plan.weeks.map((week) => week.workouts.filter((workout) => workout.type === "long_run").length);
  if (longRunTypeCount.some((count) => count > 1)) {
    issues.push("A week contains more than one long run.");
  }

  if (input.targetType === "marathon" && plan.coachNotes.length === 0) {
    issues.push("Marathon plans should include a coach warning when the build is tight.");
  }

  return issues;
}

export function countQualitySessions(plan: TrainingPlan) {
  return plan.weeks.map((week) => week.workouts.filter((workout) => workout.type === "tempo" || workout.type === "intervals").length);
}

export function getWeekLongRunDistances(plan: TrainingPlan) {
  return plan.weeks.map((week) => week.workouts.find((workout) => workout.type === "long_run")?.targetDistance ?? 0);
}

export function getPlanWorkoutTypes(plan: TrainingPlan) {
  return plan.weeks.map((week) => week.workouts.map((workout) => workout.type as WorkoutType));
}
