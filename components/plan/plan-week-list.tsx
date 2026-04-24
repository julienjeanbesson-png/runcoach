"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkoutCard } from "@/components/dashboard/workout-card";
import { formatWeekRange } from "@/lib/utils/date";
import type { TrainingWeek } from "@/types/runcoach";

function roleLabel(role: TrainingWeek["progressionRole"]) {
  switch (role) {
    case "consolidation":
      return "Consolidation week";
    case "cutback":
      return "Cutback week";
    case "taper":
      return "Taper week";
    case "build":
    default:
      return "Build week";
  }
}

function roleVariant(role: TrainingWeek["progressionRole"]) {
  switch (role) {
    case "cutback":
      return "warning";
    case "taper":
      return "neutral";
    case "consolidation":
      return "secondary";
    case "build":
    default:
      return "success";
  }
}

function roleAccentClass(role: TrainingWeek["progressionRole"]) {
  switch (role) {
    case "cutback":
      return "border-amber-200 bg-amber-50/60";
    case "taper":
      return "border-blue-200 bg-blue-50/60";
    case "consolidation":
      return "border-emerald-200 bg-emerald-50/60";
    case "build":
    default:
      return "border-slate-200 bg-white";
  }
}

export function PlanWeekList({
  weeks,
  currentWeekId,
  selectedWeekId,
  onSelectWeek
}: {
  weeks: TrainingWeek[];
  currentWeekId: string;
  selectedWeekId: string | null;
  onSelectWeek: (weekId: string) => void;
}) {
  return (
    <div className="space-y-4">
      {weeks.map((week) => {
        const isCurrent = week.id === currentWeekId;
        const isSelected = week.id === selectedWeekId;

        return (
          <Card key={week.id} className={`${roleAccentClass(week.progressionRole)} ${isSelected ? "ring-1 ring-emerald-200" : ""}`}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={isCurrent ? "success" : "secondary"}>{isCurrent ? "Current week" : week.label}</Badge>
                {isSelected ? <Badge variant="neutral">Selected</Badge> : null}
                <Badge variant={roleVariant(week.progressionRole)}>{roleLabel(week.progressionRole)}</Badge>
              </div>
              <CardTitle className="text-xl">Week {week.weekNumber}</CardTitle>
              <CardDescription>{formatWeekRange(week.startDate, week.endDate)}</CardDescription>
              <CardDescription>{week.progressionExplanation}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Runs" value={String(week.workouts.filter((workout) => workout.type !== "rest").length)} />
                <Stat label="Volume" value={`${week.totalKm} km`} />
                <Stat label="Time" value={`${week.totalDurationMin} min`} />
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                {week.progressionRole === "cutback" ? <span>Lower load week</span> : null}
                {week.progressionRole === "taper" ? <span>Taper toward target</span> : null}
                {week.progressionRole === "consolidation" ? <span>Absorb training load</span> : null}
                {isCurrent ? <span>Current plan week</span> : null}
              </div>
              <div className="space-y-3">
                {week.workouts.map((workout) => (
                  <WorkoutCard key={workout.id} workout={workout} />
                ))}
              </div>
              <Button variant="outline" className="w-full" onClick={() => onSelectWeek(week.id)}>
                Focus this week
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
