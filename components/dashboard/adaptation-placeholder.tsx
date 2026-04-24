"use client";

import { AlertTriangle, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdaptationEvent } from "@/types/runcoach";

export function AdaptationPlaceholder({ events }: { events: AdaptationEvent[] }) {
  const latestEvent = events[0];

  return (
    <Card className="border-dashed bg-white/75">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Adaptive coaching</CardTitle>
            <CardDescription>Where plan changes are explained in plain language.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
        {latestEvent ? (
          <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-slate-700">
            <p className="text-sm font-semibold text-slate-950">{latestEvent.title}</p>
            <p className="text-sm leading-6">{latestEvent.summary}</p>
            {latestEvent.changes?.length ? (
              <ul className="space-y-2 text-sm leading-6">
                {latestEvent.changes.map((change) => (
                  <li key={change} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <>
            <p>
              Feedback will appear here once a workout is saved. RunCoach only makes conservative forward-looking changes and never
              adds catch-up volume.
            </p>
            <p className="flex items-start gap-2 rounded-2xl bg-slate-50 p-4 text-slate-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              Safety rules always win over ambition.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
