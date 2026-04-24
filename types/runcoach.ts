export const runningLevels = ["beginner", "intermediate", "advanced"] as const;
export type RunningLevel = (typeof runningLevels)[number];

export const targetTypes = ["5k", "10k", "half_marathon", "marathon", "general_fitness"] as const;
export type TargetType = (typeof targetTypes)[number];

export const workoutTypes = ["easy_run", "long_run", "intervals", "tempo", "recovery", "rest"] as const;
export type WorkoutType = (typeof workoutTypes)[number];

export const workoutStatuses = ["planned", "completed", "skipped", "shortened", "pain", "rested"] as const;
export type WorkoutStatus = (typeof workoutStatuses)[number];

export const perceivedDifficulties = ["easy", "normal", "hard", "too_hard"] as const;
export type PerceivedDifficulty = (typeof perceivedDifficulties)[number];

export const sleepQualities = ["good", "ok", "poor"] as const;
export type SleepQuality = (typeof sleepQualities)[number];

export const fatigueLevels = ["low", "medium", "high"] as const;
export type FatigueLevel = (typeof fatigueLevels)[number];

export const sorenessLevels = ["none", "light", "moderate", "high"] as const;
export type SorenessLevel = (typeof sorenessLevels)[number];

export const stressLevels = ["low", "medium", "high"] as const;
export type StressLevel = (typeof stressLevels)[number];

export const readinessRecommendations = ["ready", "caution", "protect"] as const;
export type ReadinessRecommendation = (typeof readinessRecommendations)[number];

export const progressionRoles = ["build", "consolidation", "cutback", "taper"] as const;
export type ProgressionRole = (typeof progressionRoles)[number];

export interface WorkoutReadinessCheck {
  workoutId: string;
  sleepQuality: SleepQuality;
  fatigueLevel: FatigueLevel;
  sorenessLevel: SorenessLevel;
  stressLevel: StressLevel;
  submittedAt: string;
  score: number;
  recommendation: ReadinessRecommendation;
  coachExplanation: string;
  adjustedWorkoutType: WorkoutType;
  adjustedDurationMin: number;
  adjustedDistanceKm?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  runningLevel: RunningLevel;
  currentWeeklyKm: number;
  targetType: TargetType;
  targetDate: string;
  runsPerWeek: number;
  maxDurationPerSession: number;
  preferredDays: number[];
  injuryNotes: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Workout {
  id: string;
  date: string;
  dayLabel: string;
  title: string;
  type: WorkoutType;
  description: string;
  targetDuration: number;
  durationMin: number;
  targetDistance?: number;
  distanceKm?: number;
  targetRpe: number;
  targetEffort: string;
  purpose: string;
  status: WorkoutStatus;
  completedAt?: string;
  effortRating?: number;
  notes?: string;
  adapted?: boolean;
  adaptationNote?: string;
  adaptedAt?: string;
  readinessCheck?: WorkoutReadinessCheck;
}

export interface TrainingWeek {
  id: string;
  weekNumber: number;
  label: string;
  phase: "build" | "cutback" | "taper" | "short";
  progressionRole: ProgressionRole;
  progressionExplanation: string;
  startDate: string;
  endDate: string;
  totalKm: number;
  totalDurationMin: number;
  workouts: Workout[];
}

export interface TrainingPlan {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  startDate: string;
  targetDate: string;
  totalWeeks: number;
  currentWeekId: string;
  coachNotes: string[];
  weeks: TrainingWeek[];
}

export interface PlanGenerationInput {
  age: number;
  runningLevel: RunningLevel;
  currentWeeklyKm: number;
  targetType: TargetType;
  targetDate: string;
  runsPerWeek: number;
  maxDurationPerSession: number;
  preferredDays: number[];
  injuryNotes?: string;
}

export interface WorkoutFeedback {
  workoutId: string;
  completed: boolean;
  perceivedDifficulty: PerceivedDifficulty;
  fatigueFlag: boolean;
  notes: string;
  submittedAt: string;
  actualDurationMin?: number | null;
  actualDistanceKm?: number | null;
  actualPaceSecondsPerKm?: number | null;
}

export interface HistoryEntry {
  id: string;
  workoutId: string;
  workoutTitle: string;
  workoutType: WorkoutType;
  status: Exclude<WorkoutStatus, "planned">;
  completedAt: string;
  weekId?: string;
  weekLabel?: string;
  weekStartDate?: string;
  weekEndDate?: string;
  plannedDurationMin?: number;
  plannedDistanceKm?: number;
  actualDurationMin?: number;
  actualDistanceKm?: number;
  actualPaceSecondsPerKm?: number | null;
  notes: string;
  completed?: boolean;
  perceivedDifficulty?: PerceivedDifficulty;
  fatigueFlag?: boolean;
  effortRating?: number | null;
  adapted?: boolean;
  adaptationNote?: string;
  readinessCheck?: WorkoutReadinessCheck;
}

export interface WorkoutReadinessInput {
  workoutId: string;
  sleepQuality: SleepQuality;
  fatigueLevel: FatigueLevel;
  sorenessLevel: SorenessLevel;
  stressLevel: StressLevel;
  submittedAt: string;
}

export interface AdaptationEvent {
  id: string;
  createdAt: string;
  title: string;
  summary: string;
  changes?: string[];
}

export interface AppState {
  schemaVersion: 1;
  profile: UserProfile | null;
  activePlan: TrainingPlan | null;
  history: HistoryEntry[];
  adaptationEvents: AdaptationEvent[];
  ui: {
    lastVisitedRoute: string;
    selectedWeekId: string | null;
  };
}
