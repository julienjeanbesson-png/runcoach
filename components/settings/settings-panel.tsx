"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCcw, RotateCcw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRunCoach } from "@/hooks/use-runcoach";
import { WeekdayPicker } from "@/components/profile/weekday-picker";
import { formatPreferredDays, profileSummary } from "@/lib/domain/profile";
import { runningLevelLabels, targetTypeLabels, weekdayOptions } from "@/data/constants";
import type { UserProfile } from "@/types/runcoach";

export function SettingsPanel() {
  const { state, regeneratePlan, resetData, updateProfile } = useRunCoach();
  const [notice, setNotice] = useState<string | null>(null);
  const [preferredDays, setPreferredDays] = useState<number[]>([]);
  const [preferredDaysError, setPreferredDaysError] = useState<string | null>(null);

  useEffect(() => {
    setPreferredDays(state.profile?.preferredDays ?? []);
    setPreferredDaysError(null);
  }, [state.profile]);

  function onReset() {
    const confirmed = window.confirm(
      "Reset local RunCoach data? This clears your profile, plan, and history from this browser."
    );

    if (!confirmed) {
      return;
    }

    resetData();
    setNotice("Local data reset. The next visit to / will take you back to onboarding.");
  }

  function onRegenerate() {
    if (!state.profile) {
      setNotice("Add a profile first so RunCoach knows what to regenerate.");
      return;
    }

    const confirmed = window.confirm(
      "Rebuild your plan from the saved profile? This refreshes the active plan using your current settings and feedback."
    );

    if (!confirmed) {
      return;
    }

    regeneratePlan();
    setNotice("The plan was rebuilt from your saved profile. Future workouts now reflect the latest profile settings.");
  }

  function onSavePreferredDays() {
    if (!state.profile) {
      setNotice("Add a profile first before editing preferred days.");
      return;
    }

    if (preferredDays.length > 0 && preferredDays.length !== state.profile.runsPerWeek) {
      setPreferredDaysError(`Pick exactly ${state.profile.runsPerWeek} days, or clear them to use automatic spacing.`);
      return;
    }

    const updatedProfile: UserProfile = {
      ...state.profile,
      preferredDays,
      updatedAt: new Date().toISOString()
    };

    updateProfile(updatedProfile);
    setPreferredDaysError(null);
    setNotice(
      preferredDays.length
        ? `Preferred days saved. RunCoach will now schedule workouts only on ${formatPreferredDays(preferredDays)}.`
        : "Preferred days cleared. RunCoach will space workouts automatically again."
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-emerald-100 bg-white/85 p-5 shadow-soft">
        <div className="space-y-2">
          <p className="text-sm font-medium text-emerald-700">Settings</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Keep your running profile up to date</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Update the runner details RunCoach is using, then rebuild the plan if you want the latest settings to take effect.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile summary</CardTitle>
          <CardDescription>Quick view of the athlete profile currently stored in this browser. Edit from here if your running life has changed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-700">{profileSummary(state.profile)}</p>
          {state.profile ? (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{runningLevelLabels[state.profile.runningLevel as keyof typeof runningLevelLabels]}</Badge>
              <Badge variant="secondary">{targetTypeLabels[state.profile.targetType as keyof typeof targetTypeLabels]}</Badge>
              <Badge variant="secondary">{state.profile.runsPerWeek} runs/week</Badge>
            </div>
          ) : null}
          <Link href="/onboarding" className={buttonVariants({ variant: "outline" })}>
            Edit profile
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferred training days</CardTitle>
          <CardDescription>Choose the weekdays you want RunCoach to use for training. Leave them blank if you want RunCoach to space sessions automatically.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.profile ? (
            <>
              <WeekdayPicker
                selectedDays={preferredDays}
                onChange={(days) => {
                  setPreferredDays(days);
                  setPreferredDaysError(null);
                }}
                label={`Select ${state.profile.runsPerWeek} days, or leave blank for automatic spacing`}
                hint="RunCoach will only schedule workouts on the days you choose. If you leave this blank, the app spaces sessions automatically."
                error={preferredDaysError ?? undefined}
              />
              <div className="flex flex-wrap gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                {preferredDays.length ? (
                  preferredDays.map((day) => (
                    <Badge key={day} variant="secondary">
                      {weekdayOptions.find((option) => option.value === day)?.longLabel ?? String(day)}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="neutral">Automatic spacing</Badge>
                )}
              </div>
              <Button variant="outline" className="w-full justify-start gap-2" onClick={onSavePreferredDays}>
                Save preferred days
              </Button>
            </>
          ) : (
            <p className="text-sm leading-6 text-slate-600">Add a profile first, then choose the days that fit your week best.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Local controls</CardTitle>
          <CardDescription>These actions only affect data saved in your browser. Both actions ask before making a change.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">Rebuild plan</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Recalculate the current plan from your saved profile without changing your history.
            </p>
            <Button variant="outline" className="mt-4 w-full justify-start gap-2" onClick={onRegenerate} disabled={!state.profile}>
              <RefreshCcw className="h-4 w-4" />
              Rebuild plan
            </Button>
          </div>
          <div className="rounded-3xl border border-rose-100 bg-rose-50/60 p-4">
            <p className="text-sm font-semibold text-rose-900">Reset everything</p>
            <p className="mt-1 text-sm leading-6 text-rose-800">
              Clear the saved profile, plan, history, and readiness data from this browser. This cannot be undone.
            </p>
            <Button variant="destructive" className="mt-4 w-full justify-start gap-2" onClick={onReset}>
              <RotateCcw className="h-4 w-4" />
              Clear saved data
            </Button>
          </div>
          {notice ? <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{notice}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
