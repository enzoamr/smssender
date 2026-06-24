import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import type { ScheduledJob } from "./types";

/**
 * Persistance des jobs planifiés (collection `scheduled_jobs`).
 * Firestore ou mémoire selon la configuration.
 */

const COLLECTION = "scheduled_jobs";
const memoryStore: ScheduledJob[] = [];

function isFirestore(): boolean {
  return isAdminConfigured();
}

export async function createJob(job: ScheduledJob): Promise<ScheduledJob> {
  if (isFirestore()) {
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
  if (isFirestore()) {
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
  if (isFirestore()) {
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

/** Tous les jobs liés à une source donnée (ex. un rendez-vous). */
export async function listJobsByRef(
  refType: string,
  refId: string,
): Promise<ScheduledJob[]> {
  if (isFirestore()) {
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

/** Un job par son id (ou null). */
export async function getJob(id: string): Promise<ScheduledJob | null> {
  if (isFirestore()) {
    const doc = await getAdminDb().collection(COLLECTION).doc(id).get();
    return doc.exists ? (doc.data() as ScheduledJob) : null;
  }
  return memoryStore.find((j) => j.id === id) ?? null;
}

/** Tous les jobs d'un compte, les prochaines échéances d'abord. */
export async function listJobsForAccount(
  accountId: string,
  limit = 200,
): Promise<ScheduledJob[]> {
  if (isFirestore()) {
    const col = getAdminDb().collection(COLLECTION);
    try {
      const snap = await col
        .where("accountId", "==", accountId)
        .orderBy("runAt", "asc")
        .limit(limit)
        .get();
      return snap.docs.map((d) => d.data() as ScheduledJob);
    } catch {
      // Index composite (accountId + runAt) absent : repli en mémoire.
      const snap = await col
        .where("accountId", "==", accountId)
        .limit(500)
        .get();
      return snap.docs
        .map((d) => d.data() as ScheduledJob)
        .sort((a, b) => a.runAt.localeCompare(b.runAt))
        .slice(0, limit);
    }
  }
  return memoryStore
    .filter((j) => j.accountId === accountId)
    .sort((a, b) => a.runAt.localeCompare(b.runAt))
    .slice(0, limit);
}
