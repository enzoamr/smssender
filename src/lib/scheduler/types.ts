/**
 * Planification générique de tâches (« jobs »).
 *
 * Cette couche ne connaît AUCUN cas d'usage précis : un job dit simplement
 * « à telle heure, exécuter telle action (kind) avec telles données (payload) ».
 * Le calendrier (rappels de RDV), l'envoi unitaire planifié, les campagnes
 * planifiées… créent tous le même type de job. Un cron unique exécute les jobs
 * dus. Ajouter un cas d'usage = ajouter un `case` dans `executeJob`, rien d'autre.
 */

export type JobStatus = "pending" | "done" | "failed" | "cancelled";

/** Nature de l'action. Extensible : ajouter un kind = ajouter un case dans executeJob. */
export type JobKind = "message" | "campaign";

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

/**
 * Payload d'un job `kind: "message"`.
 * `to` accepte un numéro unique (rappel de RDV) ou plusieurs (envoi planifié).
 */
export interface MessageJobPayload {
  from: string;
  to: string | string[];
  text: string;
}

/** Payload d'un job `kind: "campaign"` : tout ce qu'il faut pour lancer la campagne. */
export interface CampaignJobPayload {
  name: string;
  from: string;
  text: string;
  /** Liste ciblée, ou null pour tous les abonnés. */
  targetList: string | null;
  /** Sélection explicite de numéros (prioritaire sur targetList si présente). */
  recipientPhones?: string[];
  /** Libellé lisible de la cible, calculé à la planification (pour l'affichage). */
  targetLabel: string;
}

export interface JobRef {
  type: string;
  id: string;
}

/**
 * Vue agrégée d'un élément planifié, pour l'onglet « Planifiés ».
 * Plusieurs jobs partageant une même source (ex. les rappels d'un RDV) sont
 * regroupés en un seul item ; un envoi/une campagne = un item.
 */
export interface ScheduledItem {
  /** Clé de regroupement (refId si présent, sinon id du job). */
  key: string;
  category: "appointment" | "send" | "campaign" | "other";
  title: string;
  detail: string;
  /** Résumé des destinataires (« 3 destinataires », « Liste : VIP »…). */
  recipientsLabel: string;
  /** Prochaine échéance (la plus proche du groupe), ISO 8601. */
  runAt: string;
  /** Nombre d'envois sous-jacents (jobs). */
  count: number;
  status: JobStatus;
  /** Ids des jobs à annuler pour cet item. */
  jobIds: string[];
  /**
   * Source d'origine, pour cascader une annulation. Ex. un rappel a
   * refType "appointment" : l'annuler depuis « Planifiés » supprime le RDV.
   */
  refType: string | null;
  refId: string | null;
}
