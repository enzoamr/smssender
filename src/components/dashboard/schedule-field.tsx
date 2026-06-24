"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Champ de planification réutilisable (envoi de SMS, campagnes…).
 *
 * Bascule « Maintenant / Planifier ». En mode planifié, l'instant est calculé
 * DANS le fuseau du navigateur puis converti en ISO/UTC — comme le calendrier —
 * et exposé via un input caché `scheduleAt` (vide = envoi immédiat).
 */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function ScheduleField({
  onChange,
}: {
  /** Reçoit l'ISO planifié (ou "" pour un envoi immédiat). */
  onChange?: (iso: string) => void;
}) {
  const [mode, setMode] = useState<"now" | "later">("now");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // Valeurs par défaut (prochaine heure ronde) calculées côté client, après
  // hydratation, pour éviter toute divergence SSR/CSR.
  useEffect(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    setDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    setTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
  }, []);

  const scheduleAt = useMemo(() => {
    if (mode === "now" || !date || !time) return "";
    const d = new Date(`${date}T${time}`);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }, [mode, date, time]);

  useEffect(() => {
    onChange?.(scheduleAt);
  }, [scheduleAt, onChange]);

  return (
    <div className="space-y-2">
      <input type="hidden" name="scheduleAt" value={scheduleAt} />
      <div className="inline-flex rounded-lg border p-0.5 text-sm">
        {(["now", "later"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "rounded-md px-3 py-1 transition-colors",
              mode === m
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "now" ? "Maintenant" : "Planifier"}
          </button>
        ))}
      </div>

      {mode === "later" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="schedule-date">Date</Label>
            <Input
              id="schedule-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="schedule-time">Heure</Label>
            <Input
              id="schedule-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
