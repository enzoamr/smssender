/**
 * Webhooks sortants : configuration par compte d'une URL qui reçoit les
 * changements de statut des messages, signés en HMAC-SHA256.
 */

export interface WebhookEndpoint {
  /** = id du document : un endpoint par compte. */
  accountId: string;
  url: string | null;
  /** Secret de signature, exposé au client pour vérifier les requêtes. */
  secret: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  /** Dernière tentative de livraison. */
  lastDeliveryAt: string | null;
  /** Code HTTP renvoyé par l'URL du client (null = injoignable). */
  lastStatus: number | null;
}

export interface WebhookEndpointView {
  url: string | null;
  secret: string;
  enabled: boolean;
  lastDeliveryAt: string | null;
  lastStatus: number | null;
}

export function toWebhookView(ep: WebhookEndpoint): WebhookEndpointView {
  return {
    url: ep.url,
    secret: ep.secret,
    enabled: ep.enabled,
    lastDeliveryAt: ep.lastDeliveryAt,
    lastStatus: ep.lastStatus,
  };
}

/** Corps POST envoyé à l'URL du client (aligné sur le contrat documenté). */
export interface WebhookEventPayload {
  data: {
    id: string;
    request_id: string | null;
    channel: string;
    status: string;
    type: "STATUS";
    to: string;
  };
}
