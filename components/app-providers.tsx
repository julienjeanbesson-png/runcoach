"use client";

import type { ReactNode } from "react";
import { RunCoachProvider } from "@/hooks/use-runcoach";

export function AppProviders({ children }: { children: ReactNode }) {
  return <RunCoachProvider>{children}</RunCoachProvider>;
}
