"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HistoryEntry, TrainingWeek } from "@/types/runcoach";

export function DashboardSummary({
  week,
  history,
  coachSummary
}: {
  week: TrainingWeek | null;
  history: HistoryEntry[];
  coachSummary: string;
}) {
  if (!week) {
    return (
      <Card className="border-dashed bg-white/80">
        <CardContent className="space-y-2 p-5">
          <h3 className="text-base font-semibold text-slate-950">No plan loaded yet</h3>
          <p className="text-sm leading-6 text-slate-600">Finish onboarding and RunCoach will build your first week here.</p>
        </CardContent>
      </Card>
    );
  }

  const plannedRuns = week.workouts.filter((workout) => workout.type !== "rest").length;
  const completedRuns = history.filter((entry) => entry.weekId === week.id && entry.completed && entry.workoutType !== "rest").length;
  const plannedDistance = week.totalKm;
  const completedDistance = roundDistance(
    history
      .filter((entry) => entry.weekId === week.id && entry.completed)
      .reduce((total, entry) => total + (entry.actualDistanceKm ?? entry.plannedDistanceKm ?? 0), 0)
  );

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-emerald-700">Today’s coaching note</p>
            <CardTitle className="text-slate-950">{week.label}</CardTitle>
          </div>
          <Badge
            variant={
              week.progressionRole === "cutback"
                ? "warning"
                : week.progressionRole === "taper"
                  ? "neutral"
                  : week.progressionRole === "consolidation"
                    ? "secondary"
                    : "success"
            }
          >
            {week.progressionRole === "build"
              ? "Build week"
              : week.progressionRole === "consolidation"
                ? "Consolidation week"
                : week.progressionRole === "cutback"
                  ? "Cutback week"
                  : "Taper week"}
          </Badge>
        </div>
        <p className="text-sm leading-6 text-slate-600">{coachSummary}</p>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric label="Runs completed" value={`${completedRuns}/${plannedRuns}`} />
        <Metric label="Distance progress" value={`${completedDistance} / ${roundDistance(plannedDistance)} km`} />
        <Metric label="Week focus" value={formatWeekRole(week.progressionRole)} />
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function formatWeekRole(role: TrainingWeek["progressionRole"]) {
  switch (role) {
    case "build":
      return "Building load";
    case "consolidation":
      return "Holding steady";
    case "cutback":
      return "Recovering";
    case "taper":
      return "Tapering";
    default:
      return "Building load";
  }
}

function roundDistance(value: number) {
  return Math.round(value * 10) / 10;
}
