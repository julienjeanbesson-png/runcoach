"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { HistoryArchive } from "@/components/history/history-archive";
import { HistoryOverview } from "@/components/history/history-overview";
import { HistoryList } from "@/components/history/history-list";
import { RecentAdaptations } from "@/components/history/recent-adaptations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { summarizeHistoryProgress } from "@/lib/domain/history";
import { useRunCoach } from "@/hooks/use-runcoach";

export default function HistoryPage() {
  const router = useRouter();
  const { state, hydrated } = useRunCoach();
  const progress = summarizeHistoryProgress(state.history);

  useEffect(() => {
    if (hydrated && (!state.profile || !state.activePlan)) {
      router.replace("/onboarding");
    }
  }, [hydrated, router, state.activePlan, state.profile]);

  if (!hydrated) {
    return (
      <AppShell>
        <div className="h-44 animate-pulse rounded-3xl bg-white/80" />
      </AppShell>
    );
  }

  if (!state.profile || !state.activePlan) {
    return (
      <AppShell>
        <div className="h-44 animate-pulse rounded-3xl bg-white/80" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-emerald-700">Local history</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Training log</h1>
          <p className="text-sm leading-6 text-slate-600">
            Everything here stays in this browser and shows what actually happened, not just what was planned.
          </p>
        </div>

        <HistoryOverview {...progress} />

        <RecentAdaptations events={state.adaptationEvents} />

        <Card>
          <CardHeader>
            <CardTitle>Week-by-week log</CardTitle>
            <CardDescription>Completed, skipped, adapted, and planned workouts are grouped by week.</CardDescription>
          </CardHeader>
          <CardContent>
            <HistoryList plan={state.activePlan} history={state.history} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session archive</CardTitle>
            <CardDescription>Every saved feedback entry, grouped by the week it belongs to.</CardDescription>
          </CardHeader>
          <CardContent>
            <HistoryArchive history={state.history} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
