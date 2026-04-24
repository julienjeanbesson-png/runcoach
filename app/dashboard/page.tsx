"use client";

import { AppShell } from "@/components/app-shell";
import { AdaptationPlaceholder } from "@/components/dashboard/adaptation-placeholder";
import { DashboardSummary } from "@/components/dashboard/dashboard-summary";
import { NextWorkoutHighlight } from "@/components/dashboard/next-workout-highlight";
import { WeeklyCalendar } from "@/components/dashboard/weekly-calendar";
import { WeekNavigation } from "@/components/plan/week-navigation";
import { useRunCoach } from "@/hooks/use-runcoach";
import { profileSummary } from "@/lib/domain/profile";
import { formatWeekRange } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const {
    state,
    currentWeek,
    selectedWeek,
    selectedWeekNextWorkout,
    previousWeekId,
    nextWeekId,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    hydrated
  } = useRunCoach();

  if (!hydrated) {
    return (
      <AppShell>
        <div className="space-y-4">
          <div className="h-8 w-40 animate-pulse rounded-full bg-slate-200" />
          <div className="h-32 animate-pulse rounded-3xl bg-white/80" />
          <div className="h-40 animate-pulse rounded-3xl bg-white/80" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="rounded-[2rem] border border-emerald-100 bg-white/85 p-5 shadow-soft">
          <div className="space-y-2">
            <p className="text-sm font-medium text-emerald-700">Today at a glance</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            {state.profile ? `${state.profile.name}’s plan, at a glance` : "Your plan, at a glance"}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              A simple, conservative week of running that explains itself and adapts only when it needs to.
            </p>
            {selectedWeek ? (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge
                  variant={
                    selectedWeek.progressionRole === "cutback"
                      ? "warning"
                      : selectedWeek.progressionRole === "taper"
                        ? "neutral"
                        : selectedWeek.progressionRole === "consolidation"
                          ? "secondary"
                          : "success"
                  }
                >
                  {selectedWeek.progressionRole === "build"
                    ? "Build week"
                    : selectedWeek.progressionRole === "consolidation"
                      ? "Consolidation week"
                      : selectedWeek.progressionRole === "cutback"
                        ? "Cutback week"
                        : "Taper week"}
                </Badge>
                <span className="text-sm leading-6 text-slate-600">{selectedWeek.progressionExplanation}</span>
              </div>
            ) : null}
          </div>
        </div>

        {selectedWeek ? (
          <WeekNavigation
            label={`${selectedWeek.label} • ${formatWeekRange(selectedWeek.startDate, selectedWeek.endDate)}`}
            isCurrentWeek={selectedWeek.id === currentWeek?.id}
            onPrevious={goToPreviousWeek}
            onCurrent={goToCurrentWeek}
            onNext={goToNextWeek}
            hasPrevious={previousWeekId !== null}
            hasNext={nextWeekId !== null}
          />
        ) : null}

        <NextWorkoutHighlight
          workout={selectedWeekNextWorkout}
          coachContext={state.profile ? `Built from ${profileSummary(state.profile)}.` : "Your profile will shape the first week."}
        />
        <DashboardSummary state={state} selectedWeek={selectedWeek} currentWeekLabel={selectedWeek?.label ?? "Current week"} />
        <WeeklyCalendar week={selectedWeek} currentWeekId={currentWeek?.id ?? null} />

        <AdaptationPlaceholder events={state.adaptationEvents} />
      </div>
    </AppShell>
  );
}
