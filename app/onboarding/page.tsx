"use client";

import { AppShell } from "@/components/app-shell";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default function OnboardingPage() {
  return (
    <AppShell showNavigation={false}>
      <OnboardingForm />
    </AppShell>
  );
}
