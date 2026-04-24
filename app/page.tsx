"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRunCoach } from "@/hooks/use-runcoach";
import { isOnboardingComplete } from "@/lib/domain/profile";

export default function HomePage() {
  const router = useRouter();
  const { state, hydrated } = useRunCoach();

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    router.replace(isOnboardingComplete(state.profile) ? "/dashboard" : "/onboarding");
  }, [hydrated, router, state.profile]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Loading RunCoach</CardTitle>
          <CardDescription>Checking whether your profile and plan are already set up.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
