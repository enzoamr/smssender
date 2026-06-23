/**
 * Modèle des campagnes (envois groupés vers une liste de contacts).
 */

export type CampaignStatus = "sending" | "sent" | "failed";

export interface Campaign {
  id: string;
  accountId: string;
  name: string;
  from: string;
  text: string;
  /** Liste ciblée, ou `null` pour tous les contacts abonnés. */
  targetList: string | null;
  status: CampaignStatus;
  /** Nombre de destinataires retenus (abonnés de la cible). */
  recipientCount: number;
  /** Messages acceptés par l'opérateur. */
  sentCount: number;
  /** Messages rejetés. */
  failedCount: number;
  /** Segments par message. */
  segmentCount: number;
  createdAt: string;
  completedAt: string | null;
}

export interface CampaignView {
  id: string;
  name: string;
  targetList: string | null;
  status: CampaignStatus;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  segmentCount: number;
  createdAt: string;
  completedAt: string | null;
}

export function toCampaignView(c: Campaign): CampaignView {
  return {
    id: c.id,
    name: c.name,
    targetList: c.targetList,
    status: c.status,
    recipientCount: c.recipientCount,
    sentCount: c.sentCount,
    failedCount: c.failedCount,
    segmentCount: c.segmentCount,
    createdAt: c.createdAt,
    completedAt: c.completedAt,
  };
}
