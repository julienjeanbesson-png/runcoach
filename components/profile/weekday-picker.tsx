"use client";

import { Button } from "@/components/ui/button";
import { weekdayOptions } from "@/data/constants";
import { cn } from "@/lib/utils/cn";

export function WeekdayPicker({
  selectedDays,
  onChange,
  label,
  hint,
  error
}: {
  selectedDays: number[];
  onChange: (days: number[]) => void;
  label: string;
  hint?: string;
  error?: string;
}) {
  function toggleDay(day: number) {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter((value) => value !== day));
      return;
    }

    onChange([...selectedDays, day].sort((left, right) => left - right));
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {hint ? <p className="text-xs leading-5 text-slate-500">{hint}</p> : null}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {weekdayOptions.map((day) => {
          const selected = selectedDays.includes(day.value);
          return (
            <Button
              key={day.value}
              type="button"
              variant={selected ? "default" : "outline"}
              size="sm"
              className={cn("w-full justify-center px-2 text-xs sm:text-sm", selected && "shadow-soft")}
              aria-pressed={selected}
              onClick={() => toggleDay(day.value)}
            >
              {day.shortLabel}
            </Button>
          );
        })}
      </div>
      {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}
