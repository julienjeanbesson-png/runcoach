"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMinutes } from "@/lib/utils/date";

export function HistoryOverview({
  totalCompleted,
  totalSkipped,
  completionRate,
  actualDistanceKm,
  actualTimeMin,
  plannedDistanceKm,
  plannedTimeMin
}: {
  totalCompleted: number;
  totalSkipped: number;
  completionRate: number;
  actualDistanceKm: number;
  actualTimeMin: number;
  plannedDistanceKm: number;
  plannedTimeMin: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress overview</CardTitle>
        <CardDescription>Based on actual logged workouts, not just what was planned.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Metric label="Completed" value={String(totalCompleted)} />
        <Metric label="Skipped" value={String(totalSkipped)} />
        <Metric label="Completion rate" value={`${completionRate}%`} />
        <Metric label="Actual distance" value={`${actualDistanceKm} km`} detail={`${plannedDistanceKm} km planned`} />
        <Metric label="Actual time" value={formatMinutes(actualTimeMin)} detail={`${formatMinutes(plannedTimeMin)} planned`} />
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
      {detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}
    </div>
  );
}
