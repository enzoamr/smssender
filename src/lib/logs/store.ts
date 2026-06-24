import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import type { LogEntry } from "./types";

/**
 * Persistance du journal (collection `logs`).
 * Firestore ou mémoire selon la configuration.
 */

const COLLECTION = "logs";
const MEMORY_CAP = 500;
const memoryStore: LogEntry[] = [];

function isFirestore(): boolean {
  return isAdminConfigured();
}

export async function createLog(entry: LogEntry): Promise<void> {
  if (isFirestore()) {
    await getAdminDb().collection(COLLECTION).doc(entry.id).set(entry);
    return;
  }
  memoryStore.unshift(entry);
  if (memoryStore.length > MEMORY_CAP) memoryStore.length = MEMORY_CAP;
}

export async function listLogs(
  accountId: string,
  limit = 200,
): Promise<LogEntry[]> {
  if (isFirestore()) {
    const col = getAdminDb().collection(COLLECTION);
    try {
      // Chemin optimal (index composite accountId + createdAt).
      const snap = await col
        .where("accountId", "==", accountId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();
      return snap.docs.map((d) => d.data() as LogEntry);
    } catch {
      // Repli si l'index n'existe pas encore : tri en mémoire.
      const snap = await col.where("accountId", "==", accountId).get();
      return snap.docs
        .map((d) => d.data() as LogEntry)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit);
    }
  }
  return memoryStore
    .filter((l) => l.accountId === accountId)
    .slice(0, limit);
}
