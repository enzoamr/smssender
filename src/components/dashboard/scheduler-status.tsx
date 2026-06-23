import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarClock, CircleAlert, CircleCheck, Clock } from "lucide-react";

/**
 * Voyant de santé du planificateur : indique si le cron s'exécute bien
 * (dernière exécution récente) et combien de rappels sont programmés.
 */
export function SchedulerStatus({
  lastRunAt,
  pendingCount,
}: {
  lastRunAt: string | null;
  pendingCount: number;
}) {
  const last = lastRunAt ? new Date(lastRunAt) : null;
  const ageMinutes = last ? (Date.now() - last.getTime()) / 60_000 : Infinity;
  const healthy = ageMinutes < 15; // cron prévu toutes les 5 min

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-4 py-2.5 text-sm">
      <div className="flex items-center gap-2">
        {last == null ? (
          <>
            <Clock className="size-4 shrink-0 text-amber-500" />
            <span className="text-muted-foreground">
              En attente de la première exécution automatique…
            </span>
          </>
        ) : healthy ? (
          <>
            <CircleCheck className="size-4 shrink-0 text-emerald-500" />
            <span>
              Envoi automatique actif · dernière vérification{" "}
              {formatDistanceToNow(last, { addSuffix: true, locale: fr })}
            </span>
          </>
        ) : (
          <>
            <CircleAlert className="size-4 shrink-0 text-destructive" />
            <span className="text-destructive">
              Aucune exécution depuis{" "}
              {formatDistanceToNow(last, { locale: fr })} — vérifiez la fonction
              Firebase / le déclencheur.
            </span>
          </>
        )}
      </div>
      <span className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
        <CalendarClock className="size-4" />
        {pendingCount} rappel{pendingCount > 1 ? "s" : ""} programmé
        {pendingCount > 1 ? "s" : ""}
      </span>
    </div>
  );
}
