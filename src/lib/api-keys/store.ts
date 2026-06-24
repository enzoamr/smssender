import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import type { ApiKey } from "./types";

/**
 * Persistance des clés API.
 *
 * Comme pour les messages : Firestore (collection `api_keys`) dès que FIREBASE_*
 * est configuré, sinon store en mémoire (mode démo). Les clés ne sont stockées
 * que sous forme de hash — voir types.ts.
 */

const COLLECTION = "api_keys";
const memoryStore: ApiKey[] = [];

function isFirestore(): boolean {
  return isAdminConfigured();
}

export async function createApiKey(key: ApiKey): Promise<ApiKey> {
  if (isFirestore()) {
    await getAdminDb().collection(COLLECTION).doc(key.id).set(key);
    return key;
  }
  memoryStore.unshift(key);
  return key;
}

export async function getApiKey(id: string): Promise<ApiKey | null> {
  if (isFirestore()) {
    const doc = await getAdminDb().collection(COLLECTION).doc(id).get();
    return doc.exists ? (doc.data() as ApiKey) : null;
  }
  return memoryStore.find((k) => k.id === id) ?? null;
}

export async function listApiKeys(accountId: string): Promise<ApiKey[]> {
  if (isFirestore()) {
    const snap = await getAdminDb()
      .collection(COLLECTION)
      .where("accountId", "==", accountId)
      .get();
    // Tri en mémoire : peu de clés par compte, pas besoin d'index composite.
    return snap.docs
      .map((d) => d.data() as ApiKey)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return memoryStore
    .filter((k) => k.accountId === accountId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function findApiKeyByHash(hash: string): Promise<ApiKey | null> {
  if (isFirestore()) {
    const snap = await getAdminDb()
      .collection(COLLECTION)
      .where("hash", "==", hash)
      .limit(1)
      .get();
    return snap.empty ? null : (snap.docs[0].data() as ApiKey);
  }
  return memoryStore.find((k) => k.hash === hash) ?? null;
}

export async function updateApiKey(
  id: string,
  patch: Partial<ApiKey>,
): Promise<void> {
  if (isFirestore()) {
    await getAdminDb().collection(COLLECTION).doc(id).set(patch, { merge: true });
    return;
  }
  const found = memoryStore.find((k) => k.id === id);
  if (found) Object.assign(found, patch);
}
