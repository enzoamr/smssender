"use client";

import { useTransition } from "react";
import {
  Bell,
  CalendarClock,
  Loader2,
  Megaphone,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cancelScheduledAction } from "@/app/dashboard/scheduled/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ScheduledItem } from "@/lib/scheduler/types";

const CATEGORY = {
  appointment: { label: "Rappel RDV", icon: Bell },
  send: { label: "SMS", icon: Send },
  campaign: { label: "Campagne", icon: Megaphone },
  other: { label: "Tâche", icon: CalendarClock },
} as const;

const STATUS = {
  done: {
    label: "Envoyé",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  cancelled: { label: "Annulé", className: "bg-muted text-muted-foreground" },
  failed: { label: "Échec", className: "bg-destructive/10 text-destructive" },
  pending: {
    label: "En attente",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
} as const;

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relative(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "imminent";
  const min = Math.round(diff / 60_000);
  if (min < 60) return `dans ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `dans ${h} h`;
  return `dans ${Math.round(h / 24)} j`;
}

export function ScheduledManager({
  upcoming,
  history,
}: {
  upcoming: ScheduledItem[];
  history: ScheduledItem[];
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>À venir ({upcoming.length})</CardTitle>
          <CardDescription>
            SMS, campagnes et rappels programmés. Vous pouvez les annuler tant
            qu&apos;ils ne sont pas partis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcoming.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Rien de planifié pour l&apos;instant. Programmez un envoi depuis
              « Envoyer un SMS », « Campagnes » ou le « Calendrier ».
            </p>
          ) : (
            upcoming.map((item) => <UpcomingRow key={item.key} item={item} />)
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique récent</CardTitle>
            <CardDescription>
              Les dernières tâches exécutées, annulées ou en échec.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.map((item) => (
              <HistoryRow key={item.jobIds[0] ?? item.key} item={item} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function UpcomingRow({ item }: { item: ScheduledItem }) {
  const [pending, startTransition] = useTransition();
  const Icon = CATEGORY[item.category].icon;

  const isAppointment = item.category === "appointment";

  function cancel() {
    const msg = isAppointment
      ? "Supprimer ce rendez-vous et tous ses rappels ?"
      : item.count > 1
        ? `Annuler ces ${item.count} envois programmés ?`
        : "Annuler cet envoi programmé ?";
    if (!window.confirm(msg)) return;
    startTransition(async () => {
      const { ok } = await cancelScheduledAction({
        jobIds: item.jobIds,
        refType: item.refType,
        refId: item.refId,
      });
      if (ok) {
        toast.success(
          isAppointment ? "Rendez-vous supprimé." : "Envoi annulé.",
        );
      } else {
        toast.error("Action impossible (déjà parti ?).");
      }
    });
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
      <div className="flex min-w-0 gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
            {item.title}
            {item.count > 1 && (
              <Badge variant="secondary">{item.count} rappels</Badge>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {item.recipientsLabel}
          </p>
          {item.detail && (
            <p className="line-clamp-1 text-xs text-muted-foreground">
              « {item.detail} »
            </p>
          )}
          <p className="text-xs font-medium text-primary">
            {formatWhen(item.runAt)} · {relative(item.runAt)}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={cancel}
        disabled={pending}
        aria-label={isAppointment ? "Supprimer" : "Annuler"}
        title={isAppointment ? "Supprimer le rendez-vous" : "Annuler"}
      >
        {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
      </Button>
    </div>
  );
}

function HistoryRow({ item }: { item: ScheduledItem }) {
  const Icon = CATEGORY[item.category].icon;
  const status = STATUS[item.status] ?? STATUS.done;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="flex min-w-0 items-center gap-3">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="truncate text-sm">
            {item.title}{" "}
            <span className="text-muted-foreground">
              · {item.recipientsLabel}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {formatWhen(item.runAt)}
          </p>
        </div>
      </div>
      <Badge
        variant="outline"
        className={`shrink-0 border-transparent ${status.className}`}
      >
        {status.label}
      </Badge>
    </div>
  );
}
