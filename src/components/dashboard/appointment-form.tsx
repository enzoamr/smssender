"use client";

import { useActionState, useEffect, useState } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createAppointmentAction,
  type AppointmentActionState,
} from "@/app/dashboard/calendar/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: AppointmentActionState = { status: "idle", message: "" };

export const REMINDER_OPTIONS = [
  { value: 10080, label: "1 semaine avant" },
  { value: 1440, label: "1 jour avant" },
  { value: 180, label: "3 h avant" },
  { value: 60, label: "1 h avant" },
  { value: 30, label: "30 min avant" },
  { value: 15, label: "15 min avant" },
];

export function AppointmentForm({
  defaultDate,
  onCreated,
}: {
  defaultDate: string;
  onCreated?: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    createAppointmentAction,
    initialState,
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

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

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" defaultValue={defaultDate} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="time">Heure</Label>
          <Input id="time" name="time" type="time" defaultValue="09:00" required />
        </div>
      </div>

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

      <div className="space-y-1.5">
        <Label>Rappels</Label>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {REMINDER_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm"
            >
              <input
                type="checkbox"
                name="reminders"
                value={opt.value}
                defaultChecked={opt.value === 1440}
                className="size-4 rounded border-input accent-primary"
              />
              {opt.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Un SMS sera envoyé automatiquement à chaque échéance cochée.
        </p>
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? <Loader2 className="animate-spin" /> : <CalendarPlus />}
        Programmer le rendez-vous
      </Button>
    </form>
  );
}
