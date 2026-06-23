"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { CalendarPlus, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  createAppointmentAction,
  type AppointmentActionState,
} from "@/app/dashboard/calendar/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const initialState: AppointmentActionState = { status: "idle", message: "" };

const QUICK_REMINDERS = [
  { m: 10080, label: "1 sem" },
  { m: 1440, label: "1 j" },
  { m: 120, label: "2 h" },
  { m: 60, label: "1 h" },
  { m: 30, label: "30 min" },
  { m: 15, label: "15 min" },
];

const UNITS = [
  { factor: 1, label: "min" },
  { factor: 60, label: "h" },
  { factor: 1440, label: "j" },
];

/** Formate un délai (minutes) en libellé court : « 2 j », « 3 h », « 45 min ». */
export function formatReminder(m: number): string {
  if (m <= 0) return "à l'heure";
  if (m % 10080 === 0) return `${m / 10080} sem`;
  if (m % 1440 === 0) return `${m / 1440} j`;
  if (m % 60 === 0) return `${m / 60} h`;
  return `${m} min`;
}

export function AppointmentForm({
  defaultDate,
  defaultSender,
  onCreated,
}: {
  defaultDate: string;
  defaultSender: string;
  onCreated?: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    createAppointmentAction,
    initialState,
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [from, setFrom] = useState(defaultSender);
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("09:00");
  const [message, setMessage] = useState("");
  const [reminders, setReminders] = useState<number[]>([1440]);
  const [customVal, setCustomVal] = useState("");
  const [unit, setUnit] = useState(60);

  // Calcul de l'instant DANS le fuseau du navigateur, puis converti en ISO (UTC).
  const startAt = useMemo(() => {
    if (!date || !time) return "";
    const d = new Date(`${date}T${time}`);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }, [date, time]);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      setName("");
      setPhone("");
      setMessage("");
      onCreated?.();
    } else if (state.status === "error") {
      toast.error(state.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function toggle(m: number) {
    setReminders((prev) =>
      prev.includes(m)
        ? prev.filter((x) => x !== m)
        : [...prev, m].sort((a, b) => b - a),
    );
  }

  function addCustom() {
    const n = Number(customVal);
    if (!Number.isFinite(n) || n <= 0) return;
    const m = Math.round(n * unit);
    setReminders((prev) =>
      prev.includes(m) ? prev : [...prev, m].sort((a, b) => b - a),
    );
    setCustomVal("");
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nom</Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jean Dupont"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Numéro</Label>
          <Input
            id="phone"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+33612345678"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="from">Expéditeur</Label>
        <Input
          id="from"
          name="from"
          value={from}
          onChange={(e) => setFrom(e.target.value.slice(0, 16))}
          maxLength={16}
          placeholder={defaultSender}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="time">Heure</Label>
          <Input
            id="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
      </div>
      <input type="hidden" name="startAt" value={startAt} />

      <div className="space-y-1.5">
        <Label htmlFor="message">Message de rappel</Label>
        <Textarea
          id="message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Rappel : votre rendez-vous est demain à 14h."
          className="min-h-20"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Rappels (avant le RDV)</Label>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_REMINDERS.map((q) => (
            <button
              key={q.m}
              type="button"
              onClick={() => toggle(q.m)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs transition-colors",
                reminders.includes(q.m)
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-muted",
              )}
            >
              {q.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={1}
            value={customVal}
            onChange={(e) => setCustomVal(e.target.value)}
            placeholder="Ex. 45"
            className="w-20"
          />
          <div className="flex gap-1">
            {UNITS.map((u) => (
              <button
                key={u.factor}
                type="button"
                onClick={() => setUnit(u.factor)}
                className={cn(
                  "rounded-md border px-2 py-1 text-xs transition-colors",
                  unit === u.factor
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-muted",
                )}
              >
                {u.label}
              </button>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addCustom}>
            <Plus />
            Ajouter
          </Button>
        </div>

        {reminders.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {reminders.map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
              >
                {formatReminder(m)} avant
                <button
                  type="button"
                  onClick={() => toggle(m)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Retirer"
                >
                  <X className="size-3" />
                </button>
                <input type="hidden" name="reminders" value={m} />
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Aucun rappel — le RDV sera seulement enregistré.
          </p>
        )}
      </div>

      <Button type="submit" disabled={pending || !startAt} className="w-full">
        {pending ? <Loader2 className="animate-spin" /> : <CalendarPlus />}
        Programmer le rendez-vous
      </Button>
    </form>
  );
}
