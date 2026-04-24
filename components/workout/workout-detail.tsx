"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { workoutTypeLabels } from "@/data/constants";
import { cn } from "@/lib/utils/cn";
import { formatLongDate, formatMinutes, formatPace } from "@/lib/utils/date";
import type { HistoryEntry, Workout } from "@/types/runcoach";
import { WorkoutFeedbackSection } from "@/components/workout/workout-feedback";
import { WorkoutReadinessSection } from "@/components/workout/workout-readiness";

export function WorkoutDetail({ workout, historyEntry }: { workout: Workout | null; historyEntry: HistoryEntry | null }) {
  if (!workout) {
    return (
      <Card>
        <CardContent className="space-y-4 p-5">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Workout not found</h1>
          <p className="text-sm leading-6 text-slate-600">The workout may have been removed or the plan has not loaded yet.</p>
          <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
            Back to dashboard
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Link href="/dashboard" className={cn(buttonVariants({ variant: "ghost" }), "w-fit px-0")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="rounded-[2rem] border border-emerald-100 bg-white/80 p-5 shadow-soft">
        <div className="space-y-2">
          <Badge variant="secondary">{workoutTypeLabels[workout.type]}</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{workout.title}</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">{workout.purpose}</p>
          <p className="text-sm text-slate-500">{formatLongDate(workout.date)}</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl">Planned workout</CardTitle>
          <CardDescription>
            What RunCoach intended before any readiness or feedback was entered. This stays visible so the comparison is always clear.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MiniStat label="Duration" value={workout.type === "rest" ? "Rest" : formatMinutes(workout.targetDuration)} />
            <MiniStat label="Target effort" value={workout.targetEffort} />
            <MiniStat label="Target RPE" value={String(workout.targetRpe)} />
            <MiniStat label="Distance" value={workout.targetDistance ? `${workout.targetDistance} km` : "—"} />
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">Plan notes</p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              This workout is sized to fit your current training load, your session cap, and the target date you gave RunCoach.
            </p>
          </div>
        </CardContent>
      </Card>

      {workout.type !== "rest" ? <WorkoutReadinessSection workout={workout} /> : null}

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl">Feedback and logged result</CardTitle>
          <CardDescription>
            After you finish, use this section to record what actually happened. It keeps the plan honest and the history useful.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {historyEntry ? (
            <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success">{historyEntry.completed ? "Completed" : "Missed"}</Badge>
                {historyEntry.adapted ? <Badge variant="warning">Adapted</Badge> : null}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MiniStat
                  label="Duration"
                  value={`${formatMinutes(historyEntry.actualDurationMin ?? historyEntry.plannedDurationMin ?? workout.targetDuration)} actual · ${formatMinutes(
                    historyEntry.plannedDurationMin ?? workout.targetDuration
                  )} planned`}
                />
                <MiniStat
                  label="Distance"
                  value={`${(historyEntry.actualDistanceKm ?? historyEntry.plannedDistanceKm ?? workout.targetDistance ?? 0).toFixed(1)} km actual · ${(historyEntry.plannedDistanceKm ?? workout.targetDistance ?? 0).toFixed(1)} km planned`}
                />
                <MiniStat label="Average pace" value={formatPace(historyEntry.actualPaceSecondsPerKm)} />
                <MiniStat label="Feeling" value={historyEntry.perceivedDifficulty ? historyEntry.perceivedDifficulty.replace("_", " ") : "—"} />
              </div>
              {historyEntry.actualDurationMin == null && historyEntry.actualDistanceKm == null ? (
                <p className="text-xs text-slate-500">No actual values were entered, so RunCoach is using the planned workout values here.</p>
              ) : null}
              {historyEntry.readinessCheck ? (
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Readiness check</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{historyEntry.readinessCheck.coachExplanation}</p>
                </div>
              ) : null}
              {historyEntry.notes ? (
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Session notes</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{historyEntry.notes}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl">Workout description</CardTitle>
          <CardDescription>The plain-language explanation of why this session exists.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Description</h2>
            <p className="text-sm leading-7 text-slate-700">{workout.description}</p>
          </div>
        </CardContent>
      </Card>

      <WorkoutFeedbackSection workoutId={workout.id} />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-950">{value}</p>
    </div>
  );
}
