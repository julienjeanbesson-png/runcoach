import type { RunningLevel, TargetType, WorkoutType } from "@/types/runcoach";

export const APP_NAME = "RunCoach";
export const STORAGE_KEY = "runcoach-v1";
export const SCHEMA_VERSION = 1 as const;

export const runningLevelLabels: Record<RunningLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced"
};

export const targetTypeLabels: Record<TargetType, string> = {
  "5k": "5K",
  "10k": "10K",
  half_marathon: "Half marathon",
  marathon: "Marathon",
  general_fitness: "General fitness"
};

export const workoutTypeLabels: Record<WorkoutType, string> = {
  easy_run: "Easy run",
  long_run: "Long run",
  intervals: "Intervals",
  tempo: "Tempo",
  recovery: "Recovery",
  race: "Race",
  rest: "Rest"
};

export const workoutStatusLabels = {
  planned: "Planned",
  completed: "Completed",
  skipped: "Skipped",
  shortened: "Shortened",
  pain: "Pain",
  rested: "Rested"
} as const;

export const sleepQualityLabels = {
  good: "Good",
  ok: "Okay",
  poor: "Poor"
} as const;

export const fatigueLevelLabels = {
  low: "Low",
  medium: "Medium",
  high: "High"
} as const;

export const sorenessLevelLabels = {
  none: "None",
  light: "Light",
  moderate: "Moderate",
  high: "High"
} as const;

export const stressLevelLabels = {
  low: "Low",
  medium: "Medium",
  high: "High"
} as const;

export const readinessRecommendationLabels = {
  ready: "Run as planned",
  caution: "Reduce load",
  protect: "Protect session"
} as const;

export const weekdayOptions = [
  { value: 0, shortLabel: "Sun", longLabel: "Sunday" },
  { value: 1, shortLabel: "Mon", longLabel: "Monday" },
  { value: 2, shortLabel: "Tue", longLabel: "Tuesday" },
  { value: 3, shortLabel: "Wed", longLabel: "Wednesday" },
  { value: 4, shortLabel: "Thu", longLabel: "Thursday" },
  { value: 5, shortLabel: "Fri", longLabel: "Friday" },
  { value: 6, shortLabel: "Sat", longLabel: "Saturday" }
] as const;

export const navigationItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/plan", label: "Plan" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" }
];
