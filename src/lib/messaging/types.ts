/**
 * Modèle de données des messages.
 *
 * Le schéma est volontairement aligné sur les standards du marché (cf. TopMessage)
 * pour que notre API publique `/api/v1` ait un contrat familier et que la migration
 * d'un provider à l'autre reste transparente.
 */

export const MESSAGE_STATUSES = [
  "QUEUED", // accepté par la plateforme, en attente d'envoi au carrier
  "SENDING", // en cours de transmission au provider (Twilio)
  "SENT", // remis au carrier
  "DELIVERED", // délivrance confirmée par le carrier
  "UNDELIVERED", // le carrier n'a pas pu délivrer
  "FAILED", // échec (numéro invalide, solde, etc.)
] as const;

export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export type Channel = "SMS" | "WHATSAPP";
export type Encoding = "STANDARD" | "UNICODE";
export type Direction = "OUTBOUND" | "INBOUND";
export type MessageType = "text";

/** Statuts considérés comme "terminaux" (plus de mise à jour attendue). */
export const TERMINAL_STATUSES: MessageStatus[] = [
  "DELIVERED",
  "UNDELIVERED",
  "FAILED",
];

/**
 * Représentation interne d'un message (telle que stockée dans Firestore).
 * Un envoi vers N destinataires produit N documents `Message`.
 */
export interface Message {
  id: string;
  accountId: string;
  status: MessageStatus;
  from: string;
  to: string;
  text: string;
  channel: Channel;
  segmentCount: number;
  encoding: Encoding;
  direction: Direction;
  country: string | null;
  type: MessageType;
  /** Identifiant du message côté provider (ex. Twilio Message SID). */
  providerId: string | null;
  /** Coût estimé en crédits. */
  price: number | null;
  /** Code d'erreur normalisé en cas d'échec (ex. invalid_recipient). */
  errorCode: string | null;
  /** Message d'erreur lisible en cas d'échec. */
  errorMessage: string | null;
  /** Source de l'envoi : tableau de bord, API publique, campagne ou planifié. */
  source: "dashboard" | "api" | "campaign" | "scheduled";
  scheduleAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Représentation publique (snake_case) renvoyée par l'API `/api/v1`.
 * Calquée sur le contrat TopMessage pour la compatibilité.
 */
export interface ApiMessage {
  id: string;
  account_id: string;
  status: MessageStatus;
  from: string;
  to: string;
  text: string;
  channel: Channel;
  segment_count: number;
  encoding: Encoding;
  direction: Direction;
  country: string | null;
  type: MessageType;
  schedule: string | null;
  /** Code d'erreur normalisé (null si pas d'échec). */
  error_code: string | null;
  /** Message d'erreur lisible (null si pas d'échec). */
  error_message: string | null;
  create_date: string;
  update_date: string;
}

export function toApiMessage(m: Message): ApiMessage {
  return {
    id: m.id,
    account_id: m.accountId,
    status: m.status,
    from: m.from,
    to: m.to,
    text: m.text,
    channel: m.channel,
    segment_count: m.segmentCount,
    encoding: m.encoding,
    direction: m.direction,
    country: m.country,
    type: m.type,
    schedule: m.scheduleAt,
    error_code: m.errorCode,
    error_message: m.errorMessage,
    create_date: m.createdAt,
    update_date: m.updatedAt,
  };
}
