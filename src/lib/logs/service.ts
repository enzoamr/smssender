import { randomUUID } from "crypto";
import { createLog, listLogs } from "./store";
import { toLogView, type LogView } from "./types";

/**
 * Écriture/lecture du journal d'activité.
 *
 * Les fonctions d'écriture sont « best-effort » : les appelants les invoquent
 * sans laisser une erreur de journalisation casser la requête principale.
 */

export async function logApiRequest(
  accountId: string,
  data: {
    method: string;
    target: string;
    status: number;
    durationMs: number | null;
    detail?: string | null;
  },
): Promise<void> {
  await createLog({
    id: `log_${randomUUID()}`,
    accountId,
    type: "api",
    method: data.method,
    target: data.target,
    status: data.status,
    durationMs: data.durationMs,
    detail: data.detail ?? null,
    createdAt: new Date().toISOString(),
  });
}

export async function logWebhookDelivery(
  accountId: string,
  data: { target: string; status: number; detail?: string | null },
): Promise<void> {
  await createLog({
    id: `log_${randomUUID()}`,
    accountId,
    type: "webhook",
    method: "POST",
    target: data.target,
    status: data.status,
    durationMs: null,
    detail: data.detail ?? null,
    createdAt: new Date().toISOString(),
  });
}

export async function listLogsForAccount(
  accountId: string,
): Promise<LogView[]> {
  const logs = await listLogs(accountId);
  return logs.map(toLogView);
}
