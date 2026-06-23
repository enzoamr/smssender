import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import type { Campaign } from "./types";

/**
 * Persistance des campagnes (collection `campaigns`).
 * Firestore dès que FIREBASE_* est configuré, sinon store mémoire (démo).
 */

const COLLECTION = "campaigns";
const memoryStore: Campaign[] = [];

function useFirestore(): boolean {
  return isAdminConfigured();
}

export async function createCampaign(campaign: Campaign): Promise<Campaign> {
  if (useFirestore()) {
    await getAdminDb().collection(COLLECTION).doc(campaign.id).set(campaign);
    return campaign;
  }
  memoryStore.unshift(campaign);
  return campaign;
}

export async function updateCampaign(
  id: string,
  patch: Partial<Campaign>,
): Promise<void> {
  if (useFirestore()) {
    await getAdminDb().collection(COLLECTION).doc(id).set(patch, { merge: true });
    return;
  }
  const found = memoryStore.find((c) => c.id === id);
  if (found) Object.assign(found, patch);
}

export async function listCampaigns(
  accountId: string,
  limit = 100,
): Promise<Campaign[]> {
  if (useFirestore()) {
    const snap = await getAdminDb()
      .collection(COLLECTION)
      .where("accountId", "==", accountId)
      .limit(limit)
      .get();
    return snap.docs
      .map((d) => d.data() as Campaign)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return memoryStore
    .filter((c) => c.accountId === accountId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
