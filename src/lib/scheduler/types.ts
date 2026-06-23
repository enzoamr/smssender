/**
 * Planification générique de tâches (« jobs »).
 *
 * Cette couche ne connaît AUCUN cas d'usage précis : un job dit simplement
 * « à telle heure, exécuter telle action (kind) avec telles données (payload) ».
 * Le calendrier, l'API (scheduleAt), les campagnes planifiées… créent tous le
 * même type de job. Un cron unique exécute les jobs dus.
 */

export type JobStatus = "pending" | "done" | "failed" | "cancelled";

/** Nature de l'action. Extensible (ex. "campaign" plus tard). */
export type JobKind = "message";

export interface ScheduledJob {
  id: string;
  accountId: string;
  /** Quand exécuter (ISO 8601). */
  runAt: string;
  kind: JobKind;
  /** Données nécessaires à l'exécution (dépend du kind). */
  payload: Record<string, unknown>;
  status: JobStatus;
  /** Lien optionnel vers la source, pour annuler/retrouver en masse. */
  refType: string | null;
  refId: string | null;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Payload attendu pour un job `kind: "message"`. */
export interface MessageJobPayload {
  from: string;
  to: string;
  text: string;
}

export interface JobRef {
  type: string;
  id: string;
}

/** Trace de la dernière exécution du cron (santé du planificateur). */
export interface CronStatus {
  lastRunAt: string;
  processed: number;
  done: number;
  failed: number;
}
