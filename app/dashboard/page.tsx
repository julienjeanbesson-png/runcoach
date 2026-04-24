"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DashboardSummary } from "@/components/dashboard/dashboard-summary";
import { TodayWorkoutCard } from "@/components/dashboard/today-workout-card";
import { buttonVariants } from "@/components/ui/button";
import { useRunCoach } from "@/hooks/use-runcoach";
import { cn } from "@/lib/utils/cn";
import { formatShortWeekday, isSameDate } from "@/lib/utils/date";

export default function DashboardPage() {
  const router = useRouter();
  const { state, currentWeek, hydrated } = useRunCoach();

  useEffect(() => {
    if (hydrated && (!state.profile || !state.activePlan)) {
      router.replace("/onboarding");
    }
  }, [hydrated, router, state.activePlan, state.profile]);

  const todayWorkout = useMemo(() => {
    if (!currentWeek) {
      return null;
    }

    return currentWeek.workouts.find((workout) => isSameDate(workout.date, new Date())) ?? null;
  }, [currentWeek]);

  const nextWorkout = useMemo(() => {
    if (!currentWeek) {
      return null;
    }

    return currentWeek.workouts.find((workout) => workout.status === "planned" && !isSameDate(workout.date, new Date())) ?? null;
  }, [currentWeek]);

  const coachSummary = useMemo(() => {
    if (!currentWeek) {
      return "Finish onboarding and RunCoach will build your first week.";
    }

    if (todayWorkout) {
      return `${currentWeek.progressionExplanation} Keep the rest of today steady so the session stays useful.`;
    }

    if (nextWorkout) {
      return `No run today. Save energy for ${formatShortWeekday(nextWorkout.date)} and keep the next session controlled.`;
    }

    return `${currentWeek.progressionExplanation} Keep things simple and let recovery do its work.`;
  }, [currentWeek, nextWorkout, todayWorkout]);

  if (!hydrated) {
    return (
      <AppShell>
        <div className="space-y-4">
          <div className="h-8 w-40 animate-pulse rounded-full bg-slate-200" />
          <div className="h-48 animate-pulse rounded-3xl bg-white/80" />
          <div className="h-32 animate-pulse rounded-3xl bg-white/80" />
        </div>
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
        <div className="rounded-[2rem] border border-emerald-100 bg-white/85 p-5 shadow-soft">
          <div className="space-y-2">
            <p className="text-sm font-medium text-emerald-700">Today</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {state.profile ? `${state.profile.name}’s run today` : "Your run today"}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              A clean snapshot of today’s session, with just enough context to decide what to do next.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/plan" className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center sm:w-auto")}>
              Open full plan
            </Link>
          </div>
        </div>

        <TodayWorkoutCard workout={todayWorkout} nextWorkout={nextWorkout} />

        <DashboardSummary week={currentWeek} history={state.history} coachSummary={coachSummary} />
      </div>
    </AppShell>
  );
}
