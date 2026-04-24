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
    <Card className="overflow-hidden border-slate-900/5 bg-slate-950 text-white shadow-soft">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="neutral" className="bg-white/10 text-white">
              {isToday ? "Today’s workout" : "Next workout"}
            </Badge>
            <CardTitle className="text-white">{workout.title}</CardTitle>
            <CardDescription className="text-slate-300">{workout.purpose}</CardDescription>
            {coachContext ? <CardDescription className="text-slate-400">{coachContext}</CardDescription> : null}
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <ArrowUpRight className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm text-slate-200 sm:grid-cols-4">
          <div className="rounded-2xl bg-white/5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Effort</p>
            <p className="mt-1 font-medium text-white">{workout.targetEffort}</p>
          </div>
          <div className="rounded-2xl bg-white/5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Duration</p>
            <p className="mt-1 font-medium text-white">{formatMinutes(workout.targetDuration)}</p>
          </div>
          <div className="rounded-2xl bg-white/5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">{isToday ? "Today" : "Date"}</p>
            <p className="mt-1 font-medium text-white">{formatLongDate(workout.date)}</p>
          </div>
          <div className="rounded-2xl bg-white/5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">RPE</p>
            <p className="mt-1 font-medium text-white">{workout.targetRpe}</p>
          </div>
        </div>
        <Link
          href={`/workout/${workout.id}`}
          className={cn(buttonVariants({ variant: "outline" }), "border-white/15 bg-white text-slate-950 hover:bg-slate-100")}
        >
          View workout
        </Link>
      </CardContent>
    </Card>
  );
}
