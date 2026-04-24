"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { WorkoutDetail } from "@/components/workout/workout-detail";
import { useRunCoach } from "@/hooks/use-runcoach";
import { useParams, useRouter } from "next/navigation";
import type { HistoryEntry } from "@/types/runcoach";

function getWorkoutId(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default function WorkoutPage() {
  const router = useRouter();
  const { getWorkout, state, hydrated } = useRunCoach();
  const params = useParams<{ id?: string | string[] }>();
  const workoutId = getWorkoutId(params.id);
  const workout = workoutId ? getWorkout(workoutId) : null;
  const historyEntry = workoutId ? state.history.find((entry: HistoryEntry) => entry.workoutId === workoutId) ?? null : null;

  useEffect(() => {
    if (hydrated && (!state.profile || !state.activePlan)) {
      router.replace("/onboarding");
    }
  }, [hydrated, router, state.activePlan, state.profile]);

  if (!hydrated) {
    return (
      <AppShell>
        <div className="h-56 animate-pulse rounded-3xl bg-white/80" />
      </AppShell>
    );
  }

  if (!state.profile || !state.activePlan) {
    return (
      <AppShell>
        <div className="h-56 animate-pulse rounded-3xl bg-white/80" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <WorkoutDetail workout={workout} historyEntry={historyEntry} />
    </AppShell>
  );
}
