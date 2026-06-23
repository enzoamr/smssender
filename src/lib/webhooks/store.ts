import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import type { WebhookEndpoint } from "./types";

/**
 * Persistance des endpoints webhook (collection `webhook_endpoints`,
 * un document par compte). Firestore ou mémoire selon la configuration.
 */

const COLLECTION = "webhook_endpoints";
const memoryStore = new Map<string, WebhookEndpoint>();

function useFirestore(): boolean {
  return isAdminConfigured();
}

export async function getEndpoint(
  accountId: string,
): Promise<WebhookEndpoint | null> {
  if (useFirestore()) {
    const doc = await getAdminDb().collection(COLLECTION).doc(accountId).get();
    return doc.exists ? (doc.data() as WebhookEndpoint) : null;
  }
  return memoryStore.get(accountId) ?? null;
}

export async function saveEndpoint(ep: WebhookEndpoint): Promise<void> {
  if (useFirestore()) {
    await getAdminDb().collection(COLLECTION).doc(ep.accountId).set(ep);
    return;
  }
  memoryStore.set(ep.accountId, ep);
}
