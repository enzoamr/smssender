import { createHmac, randomBytes } from "crypto";
import { logWebhookDelivery } from "@/lib/logs/service";
import type { Message } from "@/lib/messaging/types";
import { getEndpoint, saveEndpoint } from "./store";
import {
  toWebhookView,
  type WebhookEndpoint,
  type WebhookEndpointView,
  type WebhookEventPayload,
} from "./types";

/**
 * Webhooks sortants : configuration, signature et livraison.
 *
 * Signature : `X-Sendly-Signature` = HMAC-SHA256 (hex) du corps brut avec le
 * secret du compte. Le client recalcule la même valeur pour authentifier.
 */

const SECRET_PREFIX = "whsec_";
const DELIVERY_TIMEOUT_MS = 5000;

function newSecret(): string {
  return `${SECRET_PREFIX}${randomBytes(24).toString("hex")}`;
}

export function isValidWebhookUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

async function ensureEndpoint(accountId: string): Promise<WebhookEndpoint> {
  const existing = await getEndpoint(accountId);
  if (existing) return existing;
  const now = new Date().toISOString();
  const created: WebhookEndpoint = {
    accountId,
    url: null,
    secret: newSecret(),
    enabled: false,
    createdAt: now,
    updatedAt: now,
    lastDeliveryAt: null,
    lastStatus: null,
  };
  await saveEndpoint(created);
  return created;
}

export async function getEndpointView(
  accountId: string,
): Promise<WebhookEndpointView> {
  return toWebhookView(await ensureEndpoint(accountId));
}

export interface SaveResult {
  ok: boolean;
  error?: string;
}

export async function saveWebhookConfig(
  accountId: string,
  url: string,
  enabled: boolean,
): Promise<SaveResult> {
  const trimmed = url.trim();
  if (trimmed && !isValidWebhookUrl(trimmed)) {
    return { ok: false, error: "URL invalide : une adresse HTTPS est requise." };
  }
  if (enabled && !trimmed) {
    return { ok: false, error: "Renseignez une URL avant d'activer les webhooks." };
  }
  const ep = await ensureEndpoint(accountId);
  await saveEndpoint({
    ...ep,
    url: trimmed || null,
    enabled,
    updatedAt: new Date().toISOString(),
  });
  return { ok: true };
}

export async function regenerateSecret(accountId: string): Promise<string> {
  const ep = await ensureEndpoint(accountId);
  const secret = newSecret();
  await saveEndpoint({ ...ep, secret, updatedAt: new Date().toISOString() });
  return secret;
}

function sign(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

async function deliver(
  ep: WebhookEndpoint,
  payload: WebhookEventPayload,
): Promise<number | null> {
  if (!ep.url) return null;
  const body = JSON.stringify(payload);
  try {
    const res = await fetch(ep.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sendly-Signature": sign(ep.secret, body),
      },
      body,
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
    });
    return res.status;
  } catch {
    return null;
  }
}

/**
 * Relaie un changement de statut de message vers l'URL du compte.
 * Best-effort : n'interrompt jamais le flux appelant (webhook Twilio).
 */
export async function dispatchMessageStatus(message: Message): Promise<void> {
  const ep = await getEndpoint(message.accountId);
  if (!ep || !ep.enabled || !ep.url) return;

  const payload: WebhookEventPayload = {
    data: {
      id: message.id,
      request_id: null,
      channel: message.channel,
      status: message.status,
      type: "STATUS",
      to: message.to,
    },
  };
  const status = await deliver(ep, payload);
  await saveEndpoint({
    ...ep,
    lastDeliveryAt: new Date().toISOString(),
    lastStatus: status,
  });
  await logWebhookDelivery(message.accountId, {
    target: ep.url,
    status: status ?? 0,
    detail: `STATUS · ${message.status}`,
  }).catch(() => {});
}

export interface TestResult {
  ok: boolean;
  status: number | null;
  error?: string;
}

/** Envoie un événement de test à l'URL configurée. */
export async function sendTestEvent(accountId: string): Promise<TestResult> {
  const ep = await getEndpoint(accountId);
  if (!ep || !ep.url) {
    return { ok: false, status: null, error: "Configurez d'abord une URL." };
  }
  const payload: WebhookEventPayload = {
    data: {
      id: "evt_test",
      request_id: "test",
      channel: "SMS",
      status: "DELIVERED",
      type: "STATUS",
      to: "+33600000000",
    },
  };
  const status = await deliver(ep, payload);
  await saveEndpoint({
    ...ep,
    lastDeliveryAt: new Date().toISOString(),
    lastStatus: status,
  });
  await logWebhookDelivery(accountId, {
    target: ep.url,
    status: status ?? 0,
    detail: "STATUS · test",
  }).catch(() => {});
  return { ok: status !== null && status >= 200 && status < 300, status };
}
