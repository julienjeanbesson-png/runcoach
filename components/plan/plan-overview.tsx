"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLongDate } from "@/lib/utils/date";
import { targetTypeLabels } from "@/data/constants";
import type { TrainingPlan, TrainingWeek, UserProfile } from "@/types/runcoach";

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

export function PlanOverview({
  plan,
  selectedWeek,
  profile
}: {
  plan: TrainingPlan;
  selectedWeek: TrainingWeek;
  profile: UserProfile | null;
}) {
  const currentWeek = plan.weeks.find((week) => week.id === plan.currentWeekId) ?? plan.weeks[0] ?? selectedWeek;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Plan length {plan.totalWeeks} weeks</Badge>
          <Badge variant="success">Current week {currentWeek.weekNumber}</Badge>
          <Badge variant="neutral">Selected week {selectedWeek.weekNumber}</Badge>
          <Badge variant={roleVariant(selectedWeek.progressionRole)}>{roleLabel(selectedWeek.progressionRole)}</Badge>
        </div>
        <CardTitle className="text-2xl">{plan.title}</CardTitle>
        <CardDescription>
          {profile ? `${profile.name} is building toward ${targetTypeLabels[profile.targetType]}.` : "Your running plan, organized week by week."}
        </CardDescription>
        <CardDescription>Target date: {formatLongDate(plan.targetDate)}</CardDescription>
        <CardDescription>{selectedWeek.progressionExplanation}</CardDescription>
        {plan.coachNotes.length ? (
          <div className="mt-2 space-y-2 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm leading-6 text-amber-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Coach note</p>
            <ul className="space-y-1">
              {plan.coachNotes.map((note) => (
                <li key={note}>- {note}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Metric label="Plan length" value={`${plan.totalWeeks} weeks`} />
        <Metric label="Current week" value={`Week ${currentWeek.weekNumber}`} />
        <Metric label="Selected week" value={`Week ${selectedWeek.weekNumber}`} />
        <Metric label="Target" value={profile ? targetTypeLabels[profile.targetType] : "General"} />
        <Metric label="Target date" value={formatLongDate(plan.targetDate)} />
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
