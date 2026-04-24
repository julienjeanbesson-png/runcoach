"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { APP_NAME, runningLevelLabels, targetTypeLabels } from "@/data/constants";
import { useRunCoach } from "@/hooks/use-runcoach";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  buildProfileSummaryText,
  createProfileDraft,
  validateProfileDraft,
  type ProfileDraftValues
} from "@/lib/domain/profile";
import { WeekdayPicker } from "@/components/profile/weekday-picker";
import type { RunningLevel, TargetType, UserProfile } from "@/types/runcoach";

export function OnboardingForm() {
  const router = useRouter();
  const { state, completeOnboarding, hydrated } = useRunCoach();
  const [form, setForm] = useState<ProfileDraftValues>(createProfileDraft(state.profile));
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileDraftValues, string>>>({});
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    setForm(createProfileDraft(state.profile));
    setErrors({});
    setWarnings([]);
  }, [state.profile]);

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current, [key]: undefined };
      if (key === "runsPerWeek") {
        next.preferredDays = undefined;
      }
      return next;
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateProfileDraft(form);
    setErrors(result.errors);
    setWarnings(result.warnings);

    if (Object.keys(result.errors).length > 0) {
      return;
    }

    const createdAt = state.profile?.createdAt ?? new Date().toISOString();
    const profileId = state.profile?.id ?? "profile-local";
    const profile: UserProfile = {
      id: profileId,
      name: result.normalized.name,
      age: result.normalized.age,
      runningLevel: result.normalized.runningLevel,
      currentWeeklyKm: result.normalized.currentWeeklyKm,
      targetType: result.normalized.targetType,
      targetDate: new Date(`${result.normalized.targetDate}T08:00:00.000Z`).toISOString(),
      runsPerWeek: result.normalized.runsPerWeek,
      maxDurationPerSession: result.normalized.maxDurationPerSession,
      preferredDays: result.normalized.preferredDays,
      injuryNotes: result.normalized.injuryNotes,
      onboardingCompleted: true,
      createdAt,
      updatedAt: new Date().toISOString()
    };

    completeOnboarding(profile);
    router.push("/dashboard");
  }

  if (!hydrated) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-emerald-100 bg-white/85 p-5 shadow-soft">
        <div className="space-y-2">
          <p className="text-sm font-medium text-emerald-700">{APP_NAME}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            {state.profile ? "Edit your running profile" : "Set up your running coach"}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Tell RunCoach how you run today so we can build a simple, safe weekly plan that adapts when life changes.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniCallout title="Keep it honest" text="Start from what you really run now, not a perfect week." />
            <MiniCallout title="Choose a goal" text="RunCoach will shape the plan around a clear target date." />
            <MiniCallout title="Stay in control" text="The plan stays conservative and never asks for a risky jump." />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coach profile</CardTitle>
          <CardDescription>
            Keep it honest and conservative. These values shape your weekly volume, workout mix, and how aggressive the plan can be.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={onSubmit}>
            <FieldNote
              label="What RunCoach is using"
              text={state.profile ? buildProfileSummaryText(state.profile) : "Your answers will create the first plan from scratch."}
            />

            <SetupSection title="About you" description="A few basics help RunCoach keep the plan realistic and easy to recover from.">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Your name"
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name ? <FieldError message={errors.name} /> : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min="12"
                    max="85"
                    value={form.age}
                    onChange={(e) => updateField("age", e.target.value)}
                    aria-invalid={Boolean(errors.age)}
                  />
                  <FieldHint text="Affects pace, weekly growth, and how much recovery the plan keeps." />
                  {errors.age ? <FieldError message={errors.age} /> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="runningLevel">Running level</Label>
                  <Select
                    id="runningLevel"
                    value={form.runningLevel}
                    onChange={(e) => updateField("runningLevel", e.target.value as RunningLevel)}
                  >
                    {Object.entries(runningLevelLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                  <FieldHint text="Beginners get simpler weeks. Intermediate and advanced plans can include more quality work." />
                </div>
              </div>
            </SetupSection>

            <SetupSection title="Your running week" description="These inputs shape how much load the plan can safely place into each week.">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currentWeeklyKm">Current weekly km</Label>
                  <Input
                    id="currentWeeklyKm"
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.currentWeeklyKm}
                    onChange={(e) => updateField("currentWeeklyKm", e.target.value)}
                    aria-invalid={Boolean(errors.currentWeeklyKm)}
                  />
                  <FieldHint text="Used as the anchor for the first week so the plan starts close to your real life." />
                  {errors.currentWeeklyKm ? <FieldError message={errors.currentWeeklyKm} /> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="runsPerWeek">Runs per week</Label>
                  <Select id="runsPerWeek" value={form.runsPerWeek} onChange={(e) => updateField("runsPerWeek", e.target.value)}>
                    {["2", "3", "4", "5", "6"].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </Select>
                  <FieldHint text="More runs can spread the load, but the app still keeps quality sessions limited by level." />
                  {errors.runsPerWeek ? <FieldError message={errors.runsPerWeek} /> : null}
                </div>
              </div>
              <WeekdayPicker
                selectedDays={form.preferredDays}
                onChange={(preferredDays) => updateField("preferredDays", preferredDays)}
                label="Preferred training days"
                hint="Choose the weekdays you actually want to run. Pick exactly the same number as runs per week, or leave this blank for automatic spacing."
                error={errors.preferredDays}
              />
            </SetupSection>

            <SetupSection title="Your target" description="This tells RunCoach what the block is building toward and how much specificity to use.">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="targetType">Target type</Label>
                  <Select id="targetType" value={form.targetType} onChange={(e) => updateField("targetType", e.target.value as TargetType)}>
                    {Object.entries(targetTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                  <FieldHint text="This changes the style of workouts and how race-specific the plan becomes." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDurationPerSession">Max duration per session</Label>
                  <Input
                    id="maxDurationPerSession"
                    type="number"
                    min="20"
                    max="180"
                    value={form.maxDurationPerSession}
                    onChange={(e) => updateField("maxDurationPerSession", e.target.value)}
                    aria-invalid={Boolean(errors.maxDurationPerSession)}
                  />
                  <FieldHint text="The plan will respect this cap when it distributes weekly load." />
                  {errors.maxDurationPerSession ? <FieldError message={errors.maxDurationPerSession} /> : null}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetDate">Target date</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={form.targetDate}
                  onChange={(e) => updateField("targetDate", e.target.value)}
                  aria-invalid={Boolean(errors.targetDate)}
                />
                <FieldHint text="If the date is too close, RunCoach shortens the plan safely instead of forcing a risky build." />
                {errors.targetDate ? <FieldError message={errors.targetDate} /> : null}
              </div>
            </SetupSection>

            <SetupSection title="Safety notes" description="Anything here moves the plan into a more protective mode.">
              <div className="space-y-2">
                <Label htmlFor="injuryNotes">Injury or caution notes</Label>
                <Textarea
                  id="injuryNotes"
                  value={form.injuryNotes}
                  onChange={(e) => updateField("injuryNotes", e.target.value)}
                  placeholder="Optional: calf tightness, shin splints, recent break, or anything the coach should respect."
                />
                <FieldHint text="Any caution notes move the plan into a more protective mode." />
              </div>
            </SetupSection>

            {warnings.length ? (
              <div className="space-y-2 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                <p className="font-semibold">Safety adjustments</p>
                <ul className="space-y-1">
                  {warnings.map((warning) => (
                    <li key={warning}>- {warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <Button type="submit" className="w-full">
              {state.profile ? "Save and rebuild my plan" : "Save and build my plan"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function FieldHint({ text }: { text: string }) {
  return <p className="text-xs leading-5 text-slate-500">{text}</p>;
}

function FieldError({ message }: { message: string }) {
  return <p className="text-xs font-medium text-rose-600">{message}</p>;
}

function FieldNote({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1">{text}</p>
    </div>
  );
}

function SetupSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 space-y-1">
        <p className="text-sm font-semibold text-slate-950">{title}</p>
        <p className="text-xs leading-5 text-slate-500">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function MiniCallout({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
    </div>
  );
}
