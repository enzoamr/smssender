/**
 * Journal d'activité : trace des requêtes API et des livraisons de webhooks.
 */

export type LogType = "api" | "webhook";

export interface LogEntry {
  id: string;
  accountId: string;
  type: LogType;
  /** Méthode HTTP (POST, GET…). */
  method: string;
  /** Endpoint API appelé, ou URL du webhook livré. */
  target: string;
  /** Code HTTP (0 = destination injoignable). */
  status: number;
  /** Latence en millisecondes, si mesurée. */
  durationMs: number | null;
  /** Détail libre : id de clé, type d'événement… */
  detail: string | null;
  createdAt: string;
}

export interface LogView {
  id: string;
  type: LogType;
  method: string;
  target: string;
  status: number;
  durationMs: number | null;
  detail: string | null;
  createdAt: string;
}

export function toLogView(l: LogEntry): LogView {
  return {
    id: l.id,
    type: l.type,
    method: l.method,
    target: l.target,
    status: l.status,
    durationMs: l.durationMs,
    detail: l.detail,
    createdAt: l.createdAt,
  };
}
