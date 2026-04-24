import { runningLevelLabels, targetTypeLabels, weekdayOptions } from "@/data/constants";
import { formatShortDate } from "@/lib/utils/date";
import type { RunningLevel, TargetType, UserProfile } from "@/types/runcoach";

export interface ProfileDraftValues {
  name: string;
  age: string;
  runningLevel: RunningLevel;
  currentWeeklyKm: string;
  targetType: TargetType;
  targetDate: string;
  runsPerWeek: string;
  maxDurationPerSession: string;
  preferredDays: number[];
  injuryNotes: string;
}

export interface NormalizedProfileDraft {
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
}

export interface ProfileValidationResult {
  normalized: NormalizedProfileDraft;
  errors: Partial<Record<keyof ProfileDraftValues, string>>;
  warnings: string[];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseDateInput(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizePreferredDays(values: number[]) {
  return [...new Set(values)].filter((value) => Number.isInteger(value) && value >= 0 && value <= 6).sort((left, right) => left - right);
}

export function formatPreferredDays(values: number[]) {
  const preferredDays = normalizePreferredDays(values);
  if (!preferredDays.length) {
    return "automatic spacing";
  }

  return preferredDays
    .map((value) => weekdayOptions.find((option) => option.value === value)?.shortLabel ?? String(value))
    .join(", ");
}

export function createProfileDraft(profile: UserProfile | null): ProfileDraftValues {
  if (!profile) {
    return {
      name: "",
      age: "34",
      runningLevel: "beginner",
      currentWeeklyKm: "20",
      targetType: "10k",
      targetDate: toDateInputValue(new Date(Date.now() + 42 * 24 * 60 * 60 * 1000)),
      runsPerWeek: "3",
      maxDurationPerSession: "45",
      preferredDays: [],
      injuryNotes: ""
    };
  }

  return {
    name: profile.name,
    age: String(profile.age),
    runningLevel: profile.runningLevel,
    currentWeeklyKm: String(profile.currentWeeklyKm),
    targetType: profile.targetType,
    targetDate: profile.targetDate.slice(0, 10),
    runsPerWeek: String(profile.runsPerWeek),
    maxDurationPerSession: String(profile.maxDurationPerSession),
    preferredDays: normalizePreferredDays(profile.preferredDays ?? []),
    injuryNotes: profile.injuryNotes
  };
}

export function validateProfileDraft(values: ProfileDraftValues): ProfileValidationResult {
  const errors: Partial<Record<keyof ProfileDraftValues, string>> = {};
  const warnings: string[] = [];

  const name = normalizeText(values.name);
  if (!name) {
    errors.name = "Enter your name so RunCoach can personalize the plan.";
  }

  const ageValue = Number(values.age);
  const age = Number.isFinite(ageValue) ? clamp(Math.round(ageValue), 12, 85) : 34;
  if (!values.age.trim() || !Number.isFinite(ageValue)) {
    errors.age = "Enter a valid age.";
  } else if (ageValue < 12 || ageValue > 85) {
    warnings.push("Age was normalized into a safe range.");
  }

  const currentWeeklyKmValue = Number(values.currentWeeklyKm);
  const currentWeeklyKm = Number.isFinite(currentWeeklyKmValue) ? clamp(Math.round(currentWeeklyKmValue * 10) / 10, 0, 250) : 0;
  if (!values.currentWeeklyKm.trim() || !Number.isFinite(currentWeeklyKmValue) || currentWeeklyKmValue < 0) {
    errors.currentWeeklyKm = "Enter a valid weekly distance.";
  } else if (currentWeeklyKmValue > 250) {
    warnings.push("Weekly volume was capped to keep the plan realistic.");
  }

  const runsValue = Number(values.runsPerWeek);
  const runsPerWeek = Number.isFinite(runsValue) ? clamp(Math.round(runsValue), 2, 6) : 3;
  if (!values.runsPerWeek.trim() || !Number.isFinite(runsValue)) {
    errors.runsPerWeek = "Choose how many times you realistically run each week.";
  }

  const durationValue = Number(values.maxDurationPerSession);
  const maxDurationPerSession = Number.isFinite(durationValue) ? clamp(Math.round(durationValue), 20, 180) : 45;
  if (!values.maxDurationPerSession.trim() || !Number.isFinite(durationValue)) {
    errors.maxDurationPerSession = "Enter a valid session cap.";
  } else if (durationValue < 20 || durationValue > 180) {
    warnings.push("Max session duration was normalized to a safe range.");
  }

  const preferredDays = normalizePreferredDays(values.preferredDays ?? []);
  if (preferredDays.length > 0 && preferredDays.length !== runsPerWeek) {
    errors.preferredDays = `Pick exactly ${runsPerWeek} days, or leave this blank for automatic spacing.`;
  }

  const parsedDate = parseDateInput(values.targetDate);
  let targetDate = values.targetDate;
  if (!parsedDate) {
    errors.targetDate = "Choose a valid target date.";
    targetDate = toDateInputValue(new Date(Date.now() + 42 * 24 * 60 * 60 * 1000));
  } else {
    const minTargetDate = new Date();
    minTargetDate.setDate(minTargetDate.getDate() + 7);
    if (parsedDate <= minTargetDate) {
      const adjusted = new Date();
      adjusted.setDate(adjusted.getDate() + 14);
      targetDate = toDateInputValue(adjusted);
      warnings.push("Target date was moved out a little so the plan stays safe.");
    } else {
      targetDate = toDateInputValue(parsedDate);
    }
  }

  const injuryNotes = normalizeText(values.injuryNotes);
  if (injuryNotes.length > 180) {
    warnings.push("Injury notes were trimmed to keep the profile concise.");
  }

  return {
    normalized: {
      name,
      age,
      runningLevel: values.runningLevel,
      currentWeeklyKm,
      targetType: values.targetType,
      targetDate,
      runsPerWeek,
      maxDurationPerSession,
      preferredDays,
      injuryNotes: injuryNotes.slice(0, 180)
    },
    errors,
    warnings
  };
}

export function buildProfileSummaryText(profile: UserProfile | null) {
  if (!profile) {
    return "No profile yet";
  }

  return `${profile.name}, ${profile.age}, ${runningLevelLabels[profile.runningLevel]}, ${profile.currentWeeklyKm} km/week, ${profile.runsPerWeek} runs/week, ${targetTypeLabels[profile.targetType]} on ${formatShortDate(profile.targetDate)}, preferred days: ${formatPreferredDays(profile.preferredDays ?? [])}`;
}

export function isOnboardingComplete(profile: UserProfile | null) {
  return Boolean(profile?.onboardingCompleted);
}

export function profileSummary(profile: UserProfile | null) {
  return buildProfileSummaryText(profile);
}
