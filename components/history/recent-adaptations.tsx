"use client";

import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdaptationEvent } from "@/types/runcoach";
import { formatLongDate } from "@/lib/utils/date";

export function RecentAdaptations({ events }: { events: AdaptationEvent[] }) {
  const recent = [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);

  return (
    <Card className="border-dashed bg-white/75">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Recent adaptations</CardTitle>
            <CardDescription>How RunCoach adjusted the plan and why.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {recent.length ? (
          recent.map((event) => (
            <div key={event.id} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-950">{event.title}</p>
                <Badge variant="neutral">{formatLongDate(event.createdAt)}</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{event.summary}</p>
              {event.changes?.length ? (
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                  {event.changes.map((change) => (
                    <li key={change} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))
        ) : (
          <p className="text-sm leading-6 text-slate-600">No adaptations yet. Once feedback comes in, the plan changes will appear here.</p>
        )}
      </CardContent>
    </Card>
  );
}
