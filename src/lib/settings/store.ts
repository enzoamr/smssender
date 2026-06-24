import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import type { AccountSettings } from "./types";

/**
 * Persistance des réglages de compte (collection `account_settings`,
 * un document par compte).
 */

const COLLECTION = "account_settings";
const memoryStore = new Map<string, AccountSettings>();

function isFirestore(): boolean {
  return isAdminConfigured();
}

export async function getStoredSettings(
  accountId: string,
): Promise<AccountSettings | null> {
  if (isFirestore()) {
    const doc = await getAdminDb().collection(COLLECTION).doc(accountId).get();
    return doc.exists ? (doc.data() as AccountSettings) : null;
  }
  return memoryStore.get(accountId) ?? null;
}

export async function saveStoredSettings(
  settings: AccountSettings,
): Promise<void> {
  if (isFirestore()) {
    await getAdminDb()
      .collection(COLLECTION)
      .doc(settings.accountId)
      .set(settings);
    return;
  }
  memoryStore.set(settings.accountId, settings);
}
