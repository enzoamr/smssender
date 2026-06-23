import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import type { CronStatus, ScheduledJob } from "./types";

/**
 * Persistance des jobs planifiés (collection `scheduled_jobs`).
 * Firestore ou mémoire selon la configuration.
 */

const COLLECTION = "scheduled_jobs";
const memoryStore: ScheduledJob[] = [];

function useFirestore(): boolean {
  return isAdminConfigured();
}

export async function createJob(job: ScheduledJob): Promise<ScheduledJob> {
  if (useFirestore()) {
    await getAdminDb().collection(COLLECTION).doc(job.id).set(job);
    return job;
  }
  memoryStore.unshift(job);
  return job;
}

export async function updateJob(
  id: string,
  patch: Partial<ScheduledJob>,
): Promise<void> {
  const updatedAt = new Date().toISOString();
  if (useFirestore()) {
    await getAdminDb()
      .collection(COLLECTION)
      .doc(id)
      .set({ ...patch, updatedAt }, { merge: true });
    return;
  }
  const found = memoryStore.find((j) => j.id === id);
  if (found) Object.assign(found, patch, { updatedAt });
}

/** Jobs en attente dont l'heure est passée (les plus anciens d'abord). */
export async function listDueJobs(limit = 100): Promise<ScheduledJob[]> {
  const nowIso = new Date().toISOString();
  if (useFirestore()) {
    const col = getAdminDb().collection(COLLECTION);
    try {
      const snap = await col
        .where("status", "==", "pending")
        .where("runAt", "<=", nowIso)
        .orderBy("runAt", "asc")
        .limit(limit)
        .get();
      return snap.docs.map((d) => d.data() as ScheduledJob);
    } catch {
      // Index composite (status + runAt) absent : repli en mémoire.
      const snap = await col.where("status", "==", "pending").limit(500).get();
      return snap.docs
        .map((d) => d.data() as ScheduledJob)
        .filter((j) => j.runAt <= nowIso)
        .sort((a, b) => a.runAt.localeCompare(b.runAt))
        .slice(0, limit);
    }
  }
  return memoryStore
    .filter((j) => j.status === "pending" && j.runAt <= nowIso)
    .sort((a, b) => a.runAt.localeCompare(b.runAt))
    .slice(0, limit);
}

/** Nombre de jobs encore en attente pour un compte (rappels programmés). */
export async function countPendingJobs(accountId: string): Promise<number> {
  if (useFirestore()) {
    const snap = await getAdminDb()
      .collection(COLLECTION)
      .where("accountId", "==", accountId)
      .get();
    return snap.docs.filter((d) => (d.data() as ScheduledJob).status === "pending")
      .length;
  }
  return memoryStore.filter(
    (j) => j.accountId === accountId && j.status === "pending",
  ).length;
}

// --- Santé du cron (doc global system/cron) --------------------------------

const SYSTEM_COLLECTION = "system";
const CRON_DOC = "cron";
let memoryCronStatus: CronStatus | null = null;

export async function saveCronStatus(status: CronStatus): Promise<void> {
  if (useFirestore()) {
    await getAdminDb().collection(SYSTEM_COLLECTION).doc(CRON_DOC).set(status);
    return;
  }
  memoryCronStatus = status;
}

export async function getCronStatus(): Promise<CronStatus | null> {
  if (useFirestore()) {
    const doc = await getAdminDb()
      .collection(SYSTEM_COLLECTION)
      .doc(CRON_DOC)
      .get();
    return doc.exists ? (doc.data() as CronStatus) : null;
  }
  return memoryCronStatus;
}

/** Tous les jobs liés à une source donnée (ex. un rendez-vous). */
export async function listJobsByRef(
  refType: string,
  refId: string,
): Promise<ScheduledJob[]> {
  if (useFirestore()) {
    const snap = await getAdminDb()
      .collection(COLLECTION)
      .where("refId", "==", refId)
      .get();
    return snap.docs
      .map((d) => d.data() as ScheduledJob)
      .filter((j) => j.refType === refType);
  }
  return memoryStore.filter((j) => j.refType === refType && j.refId === refId);
}
