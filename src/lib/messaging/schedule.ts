import { ApiError } from "@/lib/api/errors";
import { normalizePhone } from "@/lib/phone";
import { scheduleMessage } from "@/lib/scheduler/service";
import {
  sendMessageSchema,
  type SendContext,
  type SendMessageInput,
} from "./service";

/**
 * Planification d'un envoi de SMS — le pendant différé de `sendMessage()`.
 *
 * Même schéma de validation (from/to/text) que l'envoi immédiat, plus une date
 * `scheduleAt` future. On délègue à la couche scheduler générique : un seul job
 * est créé (visible et annulable dans « Planifiés »). Le tableau de bord ET
 * l'API publique passent par ici — aucune logique de planification dupliquée.
 */

/** Descriptif (snake_case) renvoyé pour un envoi planifié, aligné sur l'API. */
export interface ScheduledSend {
  id: string;
  status: "scheduled";
  from: string;
  to: string[];
  text: string;
  /** Date d'envoi prévue (ISO 8601). */
  schedule: string;
  create_date: string;
}

/** Vrai si `scheduleAt` est une date ISO valide et strictement future. */
export function isFutureSchedule(scheduleAt: unknown): scheduleAt is string {
  if (typeof scheduleAt !== "string" || !scheduleAt) return false;
  const ms = Date.parse(scheduleAt);
  return !Number.isNaN(ms) && ms > Date.now();
}

export async function scheduleSend(
  input: SendMessageInput,
  ctx: SendContext,
): Promise<ScheduledSend> {
  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new ApiError(400, "invalid_request", first?.message ?? "Requête invalide");
  }

  const { from, to, text, scheduleAt } = parsed.data;
  const runMs = scheduleAt ? Date.parse(scheduleAt) : NaN;
  if (Number.isNaN(runMs) || runMs <= Date.now()) {
    throw new ApiError(
      400,
      "invalid_request",
      "« scheduleAt » doit être une date future au format ISO 8601 (ex. 2026-06-25T14:30:00Z).",
    );
  }

  // Normalisation + validation E.164 immédiate : on rejette les numéros mal
  // formés tout de suite plutôt qu'au moment de l'exécution.
  const normalized: string[] = [];
  for (const raw of to) {
    const phone = normalizePhone(raw);
    if (!phone) {
      throw new ApiError(
        400,
        "invalid_request",
        `Numéro invalide : « ${raw} » (format international attendu, ex. +33612345678).`,
      );
    }
    normalized.push(phone);
  }

  const runAt = new Date(runMs).toISOString();
  const job = await scheduleMessage(
    ctx.accountId,
    runAt,
    { from, to: normalized, text },
    { type: "send", id: crypto.randomUUID() },
  );

  return {
    id: job.id,
    status: "scheduled",
    from,
    to: normalized,
    text,
    schedule: runAt,
    create_date: job.createdAt,
  };
}
