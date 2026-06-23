"use client";

import { useMemo, useState, useTransition } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Bell, ChevronLeft, ChevronRight, Clock, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { deleteAppointmentAction } from "@/app/dashboard/calendar/actions";
import {
  AppointmentForm,
  formatReminder,
} from "@/components/dashboard/appointment-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AppointmentView } from "@/lib/appointments/types";

const WEEKDAYS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];

export function CalendarView({
  appointments,
  defaultSender,
}: {
  appointments: AppointmentView[];
  defaultSender: string;
}) {
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date());
  const [showForm, setShowForm] = useState(false);

  const byDay = useMemo(() => {
    const map = new Map<string, AppointmentView[]>();
    for (const a of appointments) {
      const key = format(parseISO(a.startAt), "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(a);
      map.set(key, arr);
    }
    for (const arr of map.values())
      arr.sort((x, y) => x.startAt.localeCompare(y.startAt));
    return map;
  }, [appointments]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const selectedKey = format(selected, "yyyy-MM-dd");
  const dayAppointments = byDay.get(selectedKey) ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      {/* Calendrier */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base capitalize">
            {format(month, "MMMM yyyy", { locale: fr })}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMonth(new Date())}
            >
              Aujourd&apos;hui
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setMonth(subMonths(month, 1))}
              aria-label="Mois précédent"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setMonth(addMonths(month, 1))}
              aria-label="Mois suivant"
            >
              <ChevronRight />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-1 grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1 capitalize">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const count = byDay.get(key)?.length ?? 0;
              const isSelected = isSameDay(day, selected);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelected(day);
                    setShowForm(false);
                  }}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors",
                    !isSameMonth(day, month) && "text-muted-foreground/40",
                    isSelected
                      ? "bg-primary font-medium text-primary-foreground"
                      : "hover:bg-muted",
                    isToday(day) &&
                      !isSelected &&
                      "font-semibold text-primary",
                  )}
                >
                  {format(day, "d")}
                  {count > 0 && (
                    <span
                      className={cn(
                        "absolute bottom-1.5 size-1.5 rounded-full",
                        isSelected ? "bg-primary-foreground" : "bg-primary",
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Panneau du jour sélectionné */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base capitalize">
            {format(selected, "EEEE d MMMM", { locale: fr })}
          </CardTitle>
          <Button
            size="sm"
            variant={showForm ? "outline" : "default"}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? <X /> : <Plus />}
            {showForm ? "Fermer" : "RDV"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {showForm ? (
            <AppointmentForm
              defaultDate={selectedKey}
              defaultSender={defaultSender}
              onCreated={() => setShowForm(false)}
            />
          ) : dayAppointments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucun rendez-vous ce jour.
            </p>
          ) : (
            dayAppointments.map((a) => (
              <AppointmentItem key={a.id} appointment={a} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AppointmentItem({ appointment }: { appointment: AppointmentView }) {
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!window.confirm("Supprimer ce rendez-vous et ses rappels ?")) return;
    startTransition(async () => {
      const { ok } = await deleteAppointmentAction(appointment.id);
      if (ok) toast.success("Rendez-vous supprimé.");
      else toast.error("Suppression impossible.");
    });
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <Clock className="size-3.5 text-muted-foreground" />
            {format(parseISO(appointment.startAt), "HH:mm")}
            <span className="truncate">· {appointment.name}</span>
          </div>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {appointment.phone}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={remove}
          disabled={pending}
          aria-label="Supprimer"
        >
          <Trash2 />
        </Button>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
        {appointment.message}
      </p>
      {appointment.reminders.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Bell className="size-3" />
          {appointment.reminders.map((m) => (
            <span key={m} className="rounded bg-muted px-1.5 py-0.5">
              {formatReminder(m)} avant
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
