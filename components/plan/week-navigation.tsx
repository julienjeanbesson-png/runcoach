"use client";

import { ChevronLeft, ChevronRight, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WeekNavigation({
  label,
  isCurrentWeek,
  onPrevious,
  onCurrent,
  onNext,
  hasPrevious,
  hasNext
}: {
  label: string;
  isCurrentWeek: boolean;
  onPrevious: () => void;
  onCurrent: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Week navigation</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{label}</p>
          {isCurrentWeek ? <p className="text-xs text-emerald-700">You are on the current plan week.</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onPrevious} disabled={!hasPrevious} aria-label="Previous week">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onCurrent} aria-label="Go to current week">
            <LocateFixed className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onNext} disabled={!hasNext} aria-label="Next week">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
