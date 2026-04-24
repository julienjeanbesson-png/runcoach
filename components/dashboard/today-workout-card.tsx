"use client";

import Link from "next/link";
import { CalendarOff, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { workoutTypeLabels } from "@/data/constants";
import { cn } from "@/lib/utils/cn";
import { formatLongDate, formatMinutes, isSameDate } from "@/lib/utils/date";
import type { Workout } from "@/types/runcoach";

export function TodayWorkoutCard({
  workout,
  nextWorkout
}: {
  workout: Workout | null;
  nextWorkout: Workout | null;
}) {
  const today = new Date();

  if (!workout) {
    return (
      <Card className="border-dashed bg-white/80">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Badge variant="neutral" className="w-fit">
                Rest day
              </Badge>
              <CardTitle className="text-slate-950">No run today</CardTitle>
              <CardDescription className="max-w-xl text-slate-600">
                Take the day off, recover well, and keep the next session fresh.
              </CardDescription>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-500">
              <CalendarOff className="h-5 w-5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {nextWorkout ? (
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next workout</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{nextWorkout.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{formatLongDate(nextWorkout.date)}</p>
            </div>
          ) : null}
          <Link href="/plan" className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center")}>
            Open full plan
          </Link>
        </CardContent>
      </Card>
    );
  }

  const isToday = isSameDate(workout.date, today);

  return (
    <Card className="overflow-hidden border-emerald-100 bg-white shadow-soft">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="success" className="w-fit">
              {isToday ? "Today" : "Scheduled"}
            </Badge>
            <CardTitle className="text-slate-950">{workout.title}</CardTitle>
            <CardDescription className="max-w-xl text-slate-600">{workout.purpose}</CardDescription>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {workoutTypeLabels[workout.type]}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Type" value={workoutTypeLabels[workout.type]} />
          <Metric label="Duration" value={formatMinutes(workout.targetDuration)} />
          <Metric label={isToday ? "Today" : "Date"} value={formatLongDate(workout.date)} />
          <Metric label="RPE" value={String(workout.targetRpe)} />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Coach note</p>
          <p className="text-sm leading-6 text-slate-700">{workout.description}</p>
        </div>
        <Link
          href={`/workout/${workout.id}`}
          className={cn(buttonVariants(), "w-full justify-center sm:w-auto")}
        >
          <span>View workout</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
