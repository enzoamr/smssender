import { createHash, randomBytes, randomUUID } from "crypto";
import {
  createApiKey,
  findApiKeyByHash,
  getApiKey,
  listApiKeys,
  updateApiKey,
} from "./store";
import { toApiKeyView, type ApiKey, type ApiKeyView } from "./types";

/**
 * Logique métier des clés API : génération, vérification, révocation.
 *
 * C'est le SEUL endroit qui manipule la clé en clair. Tout le reste (store, UI,
 * API) ne voit jamais que le hash ou l'aperçu masqué.
 */

const KEY_PREFIX = "sk_live_";

export interface ApiPrincipal {
  accountId: string;
  keyId: string;
}

export interface CreatedApiKey {
  view: ApiKeyView;
  /** Clé en clair — à afficher UNE seule fois, jamais re-stockée. */
  secret: string;
}

function hashKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function maskKey(raw: string): string {
  const body = raw.slice(KEY_PREFIX.length);
  return `${KEY_PREFIX}${body.slice(0, 4)}${"•".repeat(8)}${body.slice(-4)}`;
}

/** Génère, hache et persiste une nouvelle clé. Renvoie la clé en clair (1 fois). */
export async function generateApiKey(
  accountId: string,
  name: string,
): Promise<CreatedApiKey> {
  const secret = `${KEY_PREFIX}${randomBytes(24).toString("hex")}`;
  const now = new Date().toISOString();
  const record: ApiKey = {
    id: `key_${randomUUID()}`,
    accountId,
    name: name.trim().slice(0, 60) || "Clé sans nom",
    hash: hashKey(secret),
    masked: maskKey(secret),
    status: "active",
    createdAt: now,
    lastUsedAt: null,
    revokedAt: null,
  };
  await createApiKey(record);
  return { view: toApiKeyView(record), secret };
}

export async function listApiKeysForAccount(
  accountId: string,
): Promise<ApiKeyView[]> {
  const keys = await listApiKeys(accountId);
  return keys.map(toApiKeyView);
}

/** Révoque une clé — uniquement si elle appartient bien au compte. */
export async function revokeApiKey(
  accountId: string,
  keyId: string,
): Promise<boolean> {
  const target = await getApiKey(keyId);
  if (!target || target.accountId !== accountId || target.status === "revoked") {
    return false;
  }
  await updateApiKey(keyId, {
    status: "revoked",
    revokedAt: new Date().toISOString(),
  });
  return true;
}

/** Vérifie une clé en clair : hash -> lookup -> état actif. */
export async function verifyApiKey(raw: string): Promise<ApiPrincipal | null> {
  if (!raw.startsWith(KEY_PREFIX)) return null;
  const record = await findApiKeyByHash(hashKey(raw));
  if (!record || record.status !== "active") return null;
  // Date de dernière utilisation (best-effort : n'empêche pas l'authentification).
  await updateApiKey(record.id, {
    lastUsedAt: new Date().toISOString(),
  }).catch(() => {});
  return { accountId: record.accountId, keyId: record.id };
}
