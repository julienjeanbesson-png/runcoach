"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  fatigueLevelLabels,
  readinessRecommendationLabels,
  sleepQualityLabels,
  sorenessLevelLabels,
  stressLevelLabels,
  workoutTypeLabels
} from "@/data/constants";
import { applyWorkoutReadiness } from "@/lib/plan/readiness";
import { formatMinutes } from "@/lib/utils/date";
import { useRunCoach } from "@/hooks/use-runcoach";
import type {
  ReadinessRecommendation,
  SleepQuality,
  FatigueLevel,
  SorenessLevel,
  StressLevel,
  Workout,
  WorkoutReadinessInput
} from "@/types/runcoach";

function recommendationVariant(value: ReadinessRecommendation) {
  switch (value) {
    case "ready":
      return "success";
    case "protect":
      return "warning";
    case "caution":
    default:
      return "neutral";
  }
}

export function WorkoutReadinessSection({ workout }: { workout: Workout }) {
  const { recordReadiness, state } = useRunCoach();
  const initial = workout.readinessCheck;

  const [sleepQuality, setSleepQuality] = useState<SleepQuality>(initial?.sleepQuality ?? "good");
  const [fatigueLevel, setFatigueLevel] = useState<FatigueLevel>(initial?.fatigueLevel ?? "low");
  const [sorenessLevel, setSorenessLevel] = useState<SorenessLevel>(initial?.sorenessLevel ?? "none");
  const [stressLevel, setStressLevel] = useState<StressLevel>(initial?.stressLevel ?? "low");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setSleepQuality(initial?.sleepQuality ?? "good");
    setFatigueLevel(initial?.fatigueLevel ?? "low");
    setSorenessLevel(initial?.sorenessLevel ?? "none");
    setStressLevel(initial?.stressLevel ?? "low");
  }, [initial?.fatigueLevel, initial?.sleepQuality, initial?.sorenessLevel, initial?.stressLevel, workout.id]);

  useEffect(() => {
    setMessage(null);
  }, [workout.id]);

  const preview = useMemo(
    () =>
      applyWorkoutReadiness(
        workout,
        {
          workoutId: workout.id,
          sleepQuality,
          fatigueLevel,
          sorenessLevel,
          stressLevel,
          submittedAt: new Date().toISOString()
        },
        state.profile
      ),
    [fatigueLevel, sleepQuality, sorenessLevel, stressLevel, state.profile, workout]
  );

  const readyOnly = workout.status !== "planned";
  const readiness = preview.readiness;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readyOnly) {
      return;
    }

    const payload: WorkoutReadinessInput = {
      workoutId: workout.id,
      sleepQuality,
      fatigueLevel,
      sorenessLevel,
      stressLevel,
      submittedAt: new Date().toISOString()
    };

    recordReadiness(payload);
    setMessage(readiness.coachExplanation);
  }

  if (readyOnly) {
    return (
      <Card className="border-dashed bg-white/75">
        <CardHeader>
          <CardTitle>Pre-workout readiness</CardTitle>
          <CardDescription>This workout is already in the past, so readiness checks are only available before the session starts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {initial ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={recommendationVariant(initial.recommendation)}>{readinessRecommendationLabels[initial.recommendation]}</Badge>
                <Badge variant="secondary">Score {initial.score}/100</Badge>
              </div>
              <p className="text-sm leading-6 text-slate-700">{initial.coachExplanation}</p>
            </>
          ) : (
            <p className="text-sm leading-6 text-slate-600">No readiness check was recorded for this workout.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pre-workout readiness</CardTitle>
        <CardDescription>Tell RunCoach how you feel right now and it will keep today’s recommendation conservative.</CardDescription>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant={recommendationVariant(readiness.recommendation)}>{readinessRecommendationLabels[readiness.recommendation]}</Badge>
          <Badge variant="secondary">Score {readiness.score}/100</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Sleep quality">
              <Select value={sleepQuality} onChange={(event) => setSleepQuality(event.target.value as SleepQuality)}>
                {Object.entries(sleepQualityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Fatigue level">
              <Select value={fatigueLevel} onChange={(event) => setFatigueLevel(event.target.value as FatigueLevel)}>
                {Object.entries(fatigueLevelLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Soreness">
              <Select value={sorenessLevel} onChange={(event) => setSorenessLevel(event.target.value as SorenessLevel)}>
                {Object.entries(sorenessLevelLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Stress level">
              <Select value={stressLevel} onChange={(event) => setStressLevel(event.target.value as StressLevel)}>
                {Object.entries(stressLevelLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">Coach preview</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{readiness.coachExplanation}</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MiniStat label="Workout" value={workoutTypeLabels[preview.workout.type]} />
              <MiniStat label="Duration" value={preview.workout.targetDuration > 0 ? formatMinutes(preview.workout.targetDuration) : "Rest"} />
              <MiniStat label="Distance" value={preview.workout.targetDistance ? `${preview.workout.targetDistance} km` : "—"} />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Ready keeps the workout as planned, caution trims it by about 10–20%, and protect swaps it for a safer alternative.
            </p>
          </div>

          {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}

          <Button type="submit" className="w-full">
            Save readiness check
          </Button>
        </form>

        {initial ? (
          <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-950">Saved readiness check</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{initial.coachExplanation}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
