"use client";

import Link from "next/link";
import { ArrowUpRight, TimerReset } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { formatLongDate, formatMinutes, isSameDate } from "@/lib/utils/date";
import type { Workout } from "@/types/runcoach";

export function NextWorkoutHighlight({ workout, coachContext }: { workout: Workout | null; coachContext?: string }) {
  if (!workout) {
    return (
      <Card className="border-dashed bg-white/70">
        <CardContent className="space-y-3 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <TimerReset className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-950">No workout scheduled yet</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Complete onboarding and RunCoach will build your first conservative week automatically.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isToday = isSameDate(workout.date, new Date());

  return (
    <Card className="overflow-hidden border-emerald-100 bg-white/95 shadow-soft">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="success" className="w-fit">
              {isToday ? "Today’s workout" : "Next workout"}
            </Badge>
            <CardTitle className="text-slate-950">{workout.title}</CardTitle>
            <CardDescription className="max-w-xl text-slate-600">{workout.purpose}</CardDescription>
            {coachContext ? <CardDescription className="text-slate-600">{coachContext}</CardDescription> : null}
          </div>
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Effort</p>
            <p className="mt-1 font-medium text-slate-950">{workout.targetEffort}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Duration</p>
            <p className="mt-1 font-medium text-slate-950">{formatMinutes(workout.targetDuration)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">{isToday ? "Today" : "Date"}</p>
            <p className="mt-1 font-medium text-slate-950">{formatLongDate(workout.date)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">RPE</p>
            <p className="mt-1 font-medium text-slate-950">{workout.targetRpe}</p>
          </div>
        </div>
        <Link
          href={`/workout/${workout.id}`}
          className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center sm:w-auto")}
        >
          View workout
        </Link>
      </CardHeader>
    </Card>
  );
}
