"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { NextWorkoutHighlight } from "@/components/dashboard/next-workout-highlight";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WeekNavigation } from "@/components/plan/week-navigation";
import { PlanOverview } from "@/components/plan/plan-overview";
import { PlanWeekList } from "@/components/plan/plan-week-list";
import { useRunCoach } from "@/hooks/use-runcoach";
import { formatWeekRange } from "@/lib/utils/date";

export function PlanPage() {
  const router = useRouter();
  const {
    hydrated,
    state,
    selectedWeek,
    currentWeek,
    selectedWeekNextWorkout,
    previousWeekId,
    nextWeekId,
    selectedWeekIndex,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    selectWeek
  } = useRunCoach();

  useEffect(() => {
    if (hydrated && (!state.profile || !state.activePlan)) {
      router.replace("/onboarding");
    }
  }, [hydrated, router, state.activePlan, state.profile]);

  if (!hydrated) {
    return (
      <AppShell>
        <div className="space-y-4">
          <div className="h-8 w-40 animate-pulse rounded-full bg-slate-200" />
          <div className="h-40 animate-pulse rounded-3xl bg-white/80" />
          <div className="h-72 animate-pulse rounded-3xl bg-white/80" />
        </div>
      </AppShell>
    );
  }

  if (!state.profile || !state.activePlan || !selectedWeek) {
    return (
      <AppShell>
        <div className="h-44 animate-pulse rounded-3xl bg-white/80" />
      </AppShell>
    );
  }

  const isCurrentWeek = selectedWeek.id === currentWeek?.id;
  const weekRange = formatWeekRange(selectedWeek.startDate, selectedWeek.endDate);

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-emerald-700">Full plan</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Your plan, week by week</h1>
          <p className="text-sm leading-6 text-slate-600">
            Review the entire block, jump between weeks, and see how the workload changes over time.
          </p>
        </div>

        <PlanOverview plan={state.activePlan} selectedWeek={selectedWeek} profile={state.profile} />

        <WeekNavigation
          label={`${selectedWeek.label} • ${weekRange}`}
          isCurrentWeek={isCurrentWeek}
          onPrevious={goToPreviousWeek}
          onCurrent={goToCurrentWeek}
          onNext={goToNextWeek}
          hasPrevious={previousWeekId !== null}
          hasNext={nextWeekId !== null}
        />

        <NextWorkoutHighlight
          workout={selectedWeekNextWorkout}
          coachContext={selectedWeek ? `${selectedWeek.progressionExplanation}.` : undefined}
        />

        <Card>
          <CardHeader>
            <CardTitle>All weeks in the plan</CardTitle>
            <CardDescription>Select any week to inspect its progression and workouts.</CardDescription>
          </CardHeader>
          <CardContent>
            <PlanWeekList
              weeks={state.activePlan.weeks}
              currentWeekId={state.activePlan.currentWeekId}
              selectedWeekId={selectedWeek.id}
              onSelectWeek={selectWeek}
            />
          </CardContent>
        </Card>

        <Card className="border-dashed bg-white/75">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm font-semibold text-slate-950">Progression snapshot</p>
            <p className="text-sm leading-6 text-slate-600">
              Week {Math.max(1, selectedWeekIndex + 1)} is the current focus. Lower-load and taper weeks are marked so the plan stays
              readable and conservative.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
