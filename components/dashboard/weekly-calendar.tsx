"use client";

import Link from "next/link";
import { ArrowRight, CalendarOff, CircleDashed, Sparkles, TimerReset } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { workoutStatusLabels, workoutTypeLabels } from "@/data/constants";
import { cn } from "@/lib/utils/cn";
import { addDays, formatShortDate, formatShortWeekday, isSameDate, toDateKey } from "@/lib/utils/date";
import type { TrainingWeek, Workout } from "@/types/runcoach";

function statusVariant(status: Workout["status"]) {
  switch (status) {
    case "completed":
      return "success";
    case "skipped":
    case "pain":
      return "warning";
    case "shortened":
      return "neutral";
    case "rested":
      return "secondary";
    case "planned":
    default:
      return "secondary";
  }
}

function statusClass(workout: Workout) {
  switch (workout.status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50/80";
    case "skipped":
    case "pain":
      return "border-amber-200 bg-amber-50/80";
    case "shortened":
      return "border-slate-200 bg-slate-50/80";
    case "rested":
      return "border-slate-200 bg-white";
    case "planned":
    default:
      return workout.adapted ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-white";
  }
}

function DayStateIcon({ hasWorkout, today }: { hasWorkout: boolean; today: boolean }) {
  if (!hasWorkout) {
    return <CalendarOff className={cn("h-4 w-4", today ? "text-emerald-600" : "text-slate-400")} />;
  }

  return today ? <Sparkles className="h-4 w-4 text-emerald-600" /> : <CircleDashed className="h-4 w-4 text-slate-400" />;
}

export function WeeklyCalendar({
  week,
  currentWeekId
}: {
  week: TrainingWeek | null;
  currentWeekId: string | null;
}) {
  if (!week) {
    return (
      <Card className="border-dashed bg-white/75">
        <CardContent className="p-5">
          <h3 className="text-base font-semibold text-slate-950">No calendar available yet</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Finish onboarding and RunCoach will place your workouts into a weekly calendar automatically.
          </p>
        </CardContent>
      </Card>
    );
  }

  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const dayDate = addDays(new Date(week.startDate), index);
    const workouts = week.workouts.filter((workout) => toDateKey(workout.date) === toDateKey(dayDate));
    return {
      dayDate,
      workouts,
      isToday: isSameDate(dayDate, today)
    };
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Weekly calendar</CardTitle>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              A simple week view. Tap any workout to open its detail page.
            </p>
          </div>
          {currentWeekId === week.id ? <Badge variant="success">Current plan week</Badge> : <Badge variant="secondary">Selected week</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          {weekDays.map((day) => {
            const dayWorkouts = day.workouts;
            const isRestDay = dayWorkouts.length === 0;

            return (
              <div
                key={toDateKey(day.dayDate)}
                className={cn(
                  "rounded-3xl border p-4 shadow-sm",
                  day.isToday ? "border-emerald-300 bg-emerald-50/50 ring-1 ring-emerald-200" : "border-slate-200 bg-white"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{formatShortWeekday(day.dayDate)}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">{formatShortDate(day.dayDate)}</p>
                  </div>
                  <DayStateIcon hasWorkout={!isRestDay} today={day.isToday} />
                </div>

                {day.isToday ? <Badge className="mt-3" variant="success">Today</Badge> : null}

                {isRestDay ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-3">
                    <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <TimerReset className="h-4 w-4 text-slate-400" />
                      No run today
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Keep it easy and let the plan absorb.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {dayWorkouts.map((workout) => (
                      <Link
                        key={workout.id}
                        href={`/workout/${workout.id}`}
                        className={cn("block rounded-2xl border p-3 transition hover:shadow-sm", statusClass(workout))}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-950">{workout.title}</p>
                            <p className="text-xs text-slate-500">{workoutTypeLabels[workout.type]}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant={statusVariant(workout.status)}>{workoutStatusLabels[workout.status]}</Badge>
                          {workout.adapted ? <Badge variant="success">Adapted</Badge> : null}
                        </div>
                        <p className="mt-3 text-xs leading-5 text-slate-600">{workout.purpose}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
