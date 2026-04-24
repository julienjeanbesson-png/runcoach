"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { useRunCoach } from "@/hooks/use-runcoach";

export default function SettingsPage() {
  const router = useRouter();
  const { hydrated, state } = useRunCoach();

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
          <p className="text-sm font-medium text-emerald-700">Settings</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Profile and data</h1>
          <p className="text-sm leading-6 text-slate-600">
            Manage the locally stored profile, reset the app, or prepare for the next iteration of the plan engine.
          </p>
        </div>

        <SettingsPanel />
      </div>
    </AppShell>
  );
}
