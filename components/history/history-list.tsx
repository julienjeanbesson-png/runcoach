"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { workoutStatusLabels, workoutTypeLabels } from "@/data/constants";
import { buildTrainingLogWeeks } from "@/lib/domain/history";
import { cn } from "@/lib/utils/cn";
import { formatLongDate, formatMinutes, formatPace } from "@/lib/utils/date";
import type { HistoryEntry, TrainingPlan } from "@/types/runcoach";

function statusVariant(status: string) {
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

function phaseVariant(phase: TrainingPlan["weeks"][number]["phase"]) {
  switch (phase) {
    case "cutback":
      return "warning";
    case "taper":
      return "neutral";
    case "short":
      return "secondary";
    case "build":
    default:
      return "success";
  }
}

export function HistoryList({ plan, history }: { plan: TrainingPlan | null; history: HistoryEntry[] }) {
  const weeks = buildTrainingLogWeeks(plan, history);

  if (!weeks.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-5">
          <h3 className="text-base font-semibold text-slate-950">No training log yet</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Once you complete workouts, this section will show the plan week by week with your feedback attached.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {weeks.map((week) => {
        const completedCount = week.entries.filter((entry) => entry.status === "completed").length;
        const skippedCount = week.entries.filter((entry) => entry.status === "skipped").length;
        const adaptedCount = week.entries.filter((entry) => entry.adapted).length;
        const plannedCount = week.entries.filter((entry) => entry.status === "planned").length;

        return (
          <Card key={week.key} className="overflow-hidden">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{week.label}</Badge>
                <Badge variant={phaseVariant(week.phase)}>{week.phase === "cutback" ? "Cutback week" : week.phase === "taper" ? "Taper week" : week.phase === "short" ? "Short block" : "Build week"}</Badge>
              </div>
              <CardTitle className="text-xl">{week.dateRange}</CardTitle>
              <CardDescription>
                {week.totalKm} km planned · {formatMinutes(week.totalDurationMin)} planned · {completedCount} completed · {skippedCount} skipped
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                <Stat label="Completed" value={String(completedCount)} />
                <Stat label="Skipped" value={String(skippedCount)} />
                <Stat label="Adapted" value={String(adaptedCount)} />
                <Stat label="Planned" value={String(plannedCount)} />
              </div>

              <div className="space-y-3">
                {week.entries.map((entry) => (
                  <div
                    key={entry.workoutId}
                    className={cn(
                      "rounded-2xl border border-slate-200 bg-slate-50/70 p-4",
                      entry.adapted && "border-emerald-200 bg-emerald-50/40"
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="neutral">{entry.dayLabel}</Badge>
                      <Badge variant="secondary">{workoutTypeLabels[entry.type]}</Badge>
                      <Badge variant={statusVariant(entry.status)}>{workoutStatusLabels[entry.status]}</Badge>
                      {entry.adapted ? <Badge variant="success">Adapted</Badge> : null}
                    </div>
                    <div className="mt-3 space-y-2">
                      <h3 className="text-base font-semibold text-slate-950">{entry.title}</h3>
                      <p className="text-sm leading-6 text-slate-600">{entry.purpose}</p>
                      {entry.completed == null && entry.actualDurationMin == null && entry.actualDistanceKm == null ? (
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Planned workout not yet logged</p>
                      ) : null}
                      <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                        {entry.completed != null || entry.actualDurationMin != null || entry.actualDistanceKm != null ? (
                          <span>
                            {formatMinutes(entry.actualDurationMin ?? entry.completedDurationMin ?? entry.plannedDurationMin ?? entry.targetDuration)} actual /{" "}
                            {formatMinutes(entry.plannedDurationMin ?? entry.targetDuration)} planned
                          </span>
                        ) : (
                          <span>{formatMinutes(entry.plannedDurationMin ?? entry.targetDuration)} planned</span>
                        )}
                        <span>RPE {entry.targetRpe}</span>
                        <span>{entry.targetEffort}</span>
                        {entry.completed != null || entry.actualDistanceKm != null ? (
                          <span>
                            {(entry.actualDistanceKm ?? entry.completedDistanceKm ?? entry.plannedDistanceKm ?? entry.targetDistance ?? 0).toFixed(1)} km actual /{" "}
                            {(entry.plannedDistanceKm ?? entry.completedDistanceKm ?? entry.targetDistance ?? 0).toFixed(1)} km planned
                          </span>
                        ) : (
                          <span>{(entry.plannedDistanceKm ?? entry.targetDistance ?? 0).toFixed(1)} km planned</span>
                        )}
                        {entry.actualPaceSecondsPerKm != null ? <span>Average pace {formatPace(entry.actualPaceSecondsPerKm)}</span> : null}
                      </div>
                      {entry.notes ? <p className="rounded-2xl bg-white/80 px-3 py-2 text-sm leading-6 text-slate-700">{entry.notes}</p> : null}
                      {entry.adaptationNote ? (
                        <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-900">{entry.adaptationNote}</p>
                      ) : null}
                      {entry.readinessCheck ? (
                        <p className="rounded-2xl bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
                          Readiness check: {entry.readinessCheck.coachExplanation}
                        </p>
                      ) : null}
                      {entry.completedAt ? <p className="text-xs uppercase tracking-wide text-slate-500">{formatLongDate(entry.completedAt)}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
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
