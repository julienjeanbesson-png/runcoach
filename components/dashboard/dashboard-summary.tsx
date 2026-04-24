"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { profileSummary } from "@/lib/domain/profile";
import { formatMinutes, formatWeekRange } from "@/lib/utils/date";
import type { AppState, TrainingWeek } from "@/types/runcoach";

export function DashboardSummary({
  state,
  selectedWeek,
  currentWeekLabel
}: {
  state: AppState;
  selectedWeek: TrainingWeek | null;
  currentWeekLabel: string;
}) {
  if (!selectedWeek) {
    return (
      <Card className="border-dashed">
        <CardContent className="space-y-2 p-5">
          <h3 className="text-base font-semibold text-slate-950">No plan loaded yet</h3>
          <p className="text-sm leading-6 text-slate-600">Finish onboarding and RunCoach will build a conservative first week for you.</p>
        </CardContent>
      </Card>
    );
  }

  const runCount = selectedWeek.workouts.filter((workout) => workout.type !== "rest").length;
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={selectedWeek.progressionRole === "cutback" ? "warning" : selectedWeek.progressionRole === "taper" ? "neutral" : selectedWeek.progressionRole === "consolidation" ? "secondary" : "success"}>
            {selectedWeek.progressionRole === "build"
              ? "Build week"
              : selectedWeek.progressionRole === "consolidation"
                ? "Consolidation week"
                : selectedWeek.progressionRole === "cutback"
                  ? "Cutback week"
                  : "Taper week"}
          </Badge>
        </div>
        <CardTitle>{currentWeekLabel}</CardTitle>
        <CardDescription>{formatWeekRange(selectedWeek.startDate, selectedWeek.endDate)}</CardDescription>
        <CardDescription>{selectedWeek.progressionExplanation}</CardDescription>
        {state.profile ? <CardDescription>Built from {profileSummary(state.profile)}.</CardDescription> : null}
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Metric label="Planned runs" value={String(runCount)} />
        <Metric label="Weekly volume" value={`${selectedWeek.totalKm} km`} />
        <Metric label="Weekly time" value={formatMinutes(selectedWeek.totalDurationMin)} />
        <Metric label="Plan length" value={`${state.activePlan?.totalWeeks ?? 1} weeks`} />
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
