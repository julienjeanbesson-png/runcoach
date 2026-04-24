"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { workoutStatusLabels, workoutTypeLabels } from "@/data/constants";
import { cn } from "@/lib/utils/cn";
import { formatMinutes } from "@/lib/utils/date";
import type { Workout } from "@/types/runcoach";

export function WorkoutCard({ workout }: { workout: Workout }) {
  const isRest = workout.type === "rest";
  const statusVariant: "success" | "warning" | "neutral" | "secondary" =
    workout.status === "completed"
      ? "success"
      : workout.status === "skipped"
        ? "warning"
        : workout.status === "shortened"
          ? "neutral"
          : workout.status === "pain"
            ? "warning"
            : "secondary";

  return (
    <Card className={cn("overflow-hidden", isRest && "border-dashed bg-slate-50/80", workout.adapted && "border-emerald-200 bg-emerald-50/30")}>
      <CardContent className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isRest ? "neutral" : "secondary"}>{workout.dayLabel}</Badge>
            <Badge variant={isRest ? "neutral" : "success"}>{workoutTypeLabels[workout.type]}</Badge>
            <Badge variant={statusVariant}>{workoutStatusLabels[workout.status]}</Badge>
            {workout.adapted ? <Badge variant="success">Adapted</Badge> : null}
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-950">{workout.title}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{workout.purpose}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-500">
            <span>{isRest ? "Recovery day" : formatMinutes(workout.targetDuration)}</span>
            <span>RPE {workout.targetRpe}</span>
            <span>{workout.targetEffort}</span>
            {workout.targetDistance ? <span>{workout.targetDistance} km</span> : null}
          </div>
          {workout.notes ? <p className="rounded-2xl bg-white/70 px-3 py-2 text-xs leading-5 text-slate-700">{workout.notes}</p> : null}
          {workout.adaptationNote ? <p className="rounded-2xl bg-white/70 px-3 py-2 text-xs leading-5 text-emerald-900">{workout.adaptationNote}</p> : null}
        </div>

        <Link
          href={`/workout/${workout.id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "shrink-0 rounded-full")}
          aria-label={`Open ${workout.title}`}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
