"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRunCoach } from "@/hooks/use-runcoach";
import { derivePaceSecondsPerKm, formatPace } from "@/lib/utils/date";
import type { PerceivedDifficulty } from "@/types/runcoach";

export function WorkoutFeedbackSection({ workoutId }: { workoutId: string }) {
  const { recordFeedback } = useRunCoach();
  const [completed, setCompleted] = useState("yes");
  const [perceivedDifficulty, setPerceivedDifficulty] = useState<PerceivedDifficulty>("normal");
  const [fatigueFlag, setFatigueFlag] = useState(false);
  const [notes, setNotes] = useState("");
  const [actualDurationMin, setActualDurationMin] = useState("");
  const [actualDistanceKm, setActualDistanceKm] = useState("");
  const [errors, setErrors] = useState<{ actualDurationMin?: string; actualDistanceKm?: string }>({});
  const [message, setMessage] = useState<string | null>(null);

  const derivedPace = derivePaceSecondsPerKm(
    actualDurationMin.trim() ? Number(actualDurationMin) : null,
    actualDistanceKm.trim() ? Number(actualDistanceKm) : null
  );

  function parseOptionalNumber(value: string) {
    if (!value.trim()) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: { actualDurationMin?: string; actualDistanceKm?: string } = {};
    const parsedDuration = parseOptionalNumber(actualDurationMin);
    const parsedDistance = parseOptionalNumber(actualDistanceKm);

    if (Number.isNaN(parsedDuration) || (parsedDuration !== null && parsedDuration < 0)) {
      nextErrors.actualDurationMin = "Enter a valid duration or leave it blank.";
    }
    if (Number.isNaN(parsedDistance) || (parsedDistance !== null && parsedDistance < 0)) {
      nextErrors.actualDistanceKm = "Enter a valid distance or leave it blank.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const cleanedDuration = parsedDuration === null ? null : parsedDuration;
    const cleanedDistance = parsedDistance === null ? null : parsedDistance;
    const pace = derivePaceSecondsPerKm(cleanedDuration, cleanedDistance);

    setErrors({});
    recordFeedback({
      workoutId,
      completed: completed === "yes",
      perceivedDifficulty,
      fatigueFlag,
      notes: notes.trim(),
      submittedAt: new Date().toISOString(),
      actualDurationMin: cleanedDuration,
      actualDistanceKm: cleanedDistance,
      actualPaceSecondsPerKm: pace
    });
    setMessage("Feedback saved locally. RunCoach has adjusted the plan conservatively and will not add catch-up volume.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workout feedback</CardTitle>
        <CardDescription>Capture what happened so the history stays useful, even without a watch.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="completed">Completed</Label>
            <Select id="completed" value={completed} onChange={(event) => setCompleted(event.target.value)}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Perceived difficulty</Label>
              <Select id="difficulty" value={perceivedDifficulty} onChange={(event) => setPerceivedDifficulty(event.target.value as PerceivedDifficulty)}>
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
                <option value="hard">Hard</option>
                <option value="too_hard">Too hard</option>
              </Select>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <Label className="mb-0 flex items-start gap-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={fatigueFlag}
                  onChange={(event) => setFatigueFlag(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>
                  Mark fatigue if your legs, sleep, stress, or general energy suggest the rest of the week should be lighter.
                </span>
              </Label>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="actualDurationMin">Actual duration (optional)</Label>
              <input
                id="actualDurationMin"
                type="number"
                min="0"
                step="1"
                value={actualDurationMin}
                onChange={(event) => {
                  setActualDurationMin(event.target.value);
                  setErrors((current) => ({ ...current, actualDurationMin: undefined }));
                }}
                placeholder="e.g. 42"
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
              {errors.actualDurationMin ? <p className="text-xs text-rose-600">{errors.actualDurationMin}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="actualDistanceKm">Actual distance (optional)</Label>
              <input
                id="actualDistanceKm"
                type="number"
                min="0"
                step="0.1"
                value={actualDistanceKm}
                onChange={(event) => {
                  setActualDistanceKm(event.target.value);
                  setErrors((current) => ({ ...current, actualDistanceKm: undefined }));
                }}
                placeholder="e.g. 7.4"
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
              {errors.actualDistanceKm ? <p className="text-xs text-rose-600">{errors.actualDistanceKm}</p> : null}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <p className="font-medium text-slate-900">Average pace</p>
            <p className="mt-1">
              {derivedPace ? `${formatPace(derivedPace)} will be saved from your actual duration and distance.` : "Enter both actual duration and distance to derive pace automatically."}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Session notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add anything useful: missed time, soreness, travel, stress, or injury concerns."
            />
          </div>
          {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
          <Button type="submit" className="w-full">
            Save feedback
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
