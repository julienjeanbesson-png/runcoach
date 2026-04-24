"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { workoutStatusLabels, workoutTypeLabels } from "@/data/constants";
import { groupHistoryByWeek } from "@/lib/domain/history";
import { cn } from "@/lib/utils/cn";
import { formatLongDate, formatMinutes, formatPace } from "@/lib/utils/date";
import type { HistoryEntry } from "@/types/runcoach";

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

export function HistoryArchive({ history }: { history: HistoryEntry[] }) {
  const groups = groupHistoryByWeek(history);

  if (!groups.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-5">
          <h3 className="text-base font-semibold text-slate-950">No sessions logged yet</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Your completed workouts will show up here once you start saving feedback.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Card key={group.key}>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{group.weekLabel}</Badge>
              <Badge variant="neutral">{group.dateRange}</Badge>
            </div>
            <CardTitle className="text-xl">Logged sessions</CardTitle>
            <CardDescription>Actual workouts saved in this browser for that week.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.entries.map((entry) => (
              <div
                key={entry.id}
                className={cn("rounded-2xl border border-slate-200 bg-slate-50/70 p-4", entry.adapted && "border-emerald-200 bg-emerald-50/40")}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">{entry.completedAt ? formatLongDate(entry.completedAt) : "Logged session"}</Badge>
                  <Badge variant="secondary">{workoutTypeLabels[entry.workoutType]}</Badge>
                  <Badge variant={statusVariant(entry.status)}>{workoutStatusLabels[entry.status]}</Badge>
                  {entry.adapted ? <Badge variant="success">Adapted</Badge> : null}
                </div>

                <div className="mt-3 space-y-2">
                  <h3 className="text-base font-semibold text-slate-950">{entry.workoutTitle}</h3>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                    {entry.actualDurationMin != null || entry.actualDistanceKm != null ? (
                      <>
                        <span>
                          {formatMinutes(entry.actualDurationMin ?? entry.completedDurationMin ?? entry.plannedDurationMin ?? 0)} actual
                        </span>
                        <span>{formatMinutes(entry.plannedDurationMin ?? entry.completedDurationMin ?? 0)} planned</span>
                        <span>{(entry.actualDistanceKm ?? entry.completedDistanceKm ?? entry.plannedDistanceKm ?? 0).toFixed(1)} km actual</span>
                        <span>{(entry.plannedDistanceKm ?? entry.completedDistanceKm ?? 0).toFixed(1)} km planned</span>
                      </>
                    ) : (
                      <>
                        <span>{formatMinutes(entry.plannedDurationMin ?? entry.completedDurationMin ?? 0)} planned</span>
                        <span>{(entry.plannedDistanceKm ?? entry.completedDistanceKm ?? 0).toFixed(1)} km planned</span>
                      </>
                    )}
                    {entry.actualPaceSecondsPerKm != null ? <span>Average pace {formatPace(entry.actualPaceSecondsPerKm)}</span> : null}
                    {typeof entry.completed === "boolean" ? <span>{entry.completed ? "Finished" : "Missed"}</span> : null}
                  </div>
                  {entry.notes ? <p className="rounded-2xl bg-white/80 px-3 py-2 text-sm leading-6 text-slate-700">{entry.notes}</p> : null}
                  {entry.adaptationNote ? <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-900">{entry.adaptationNote}</p> : null}
                  {entry.readinessCheck ? (
                    <p className="rounded-2xl bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
                      Readiness check: {entry.readinessCheck.coachExplanation}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {entry.perceivedDifficulty ? <Badge variant="neutral">{entry.perceivedDifficulty.replace("_", " ")}</Badge> : null}
                    {entry.fatigueFlag ? <Badge variant="warning">Fatigue flagged</Badge> : null}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
