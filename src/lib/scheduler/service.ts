import { randomUUID } from "crypto";
import { sendMessage } from "@/lib/messaging/service";
import {
  countPendingJobs,
  createJob,
  getCronStatus,
  listDueJobs,
  listJobsByRef,
  saveCronStatus,
  updateJob,
} from "./store";
import type {
  JobRef,
  MessageJobPayload,
  ScheduledJob,
} from "./types";

/**
 * Logique de planification générique : créer des jobs, les annuler, et exécuter
 * ceux qui sont dus (appelé par le cron). Ajouter un nouveau type d'action =
 * ajouter un `case` dans `executeJob`, rien d'autre à changer ailleurs.
 */

const MAX_ATTEMPTS = 3;

/** Planifie l'envoi d'un message à une date donnée. */
export async function scheduleMessage(
  accountId: string,
  runAt: Date | string,
  payload: MessageJobPayload,
  ref?: JobRef,
): Promise<ScheduledJob> {
  const now = new Date().toISOString();
  const job: ScheduledJob = {
    id: `job_${randomUUID()}`,
    accountId,
    runAt: typeof runAt === "string" ? runAt : runAt.toISOString(),
    kind: "message",
    payload: { ...payload },
    status: "pending",
    refType: ref?.type ?? null,
    refId: ref?.id ?? null,
    attempts: 0,
    lastError: null,
    createdAt: now,
    updatedAt: now,
  };
  return createJob(job);
}

/** Annule (sans supprimer) les jobs en attente liés à une source. */
export async function cancelJobsByRef(
  refType: string,
  refId: string,
): Promise<number> {
  const jobs = await listJobsByRef(refType, refId);
  const pending = jobs.filter((j) => j.status === "pending");
  await Promise.all(
    pending.map((j) => updateJob(j.id, { status: "cancelled" })),
  );
  return pending.length;
}

/** Exécute concrètement un job selon son type. */
async function executeJob(job: ScheduledJob): Promise<void> {
  switch (job.kind) {
    case "message": {
      const { from, to, text } = job.payload as unknown as MessageJobPayload;
      await sendMessage(
        { from, to, text },
        { accountId: job.accountId, source: "scheduled" },
      );
      return;
    }
    default:
      throw new Error(`Type de job inconnu : ${job.kind}`);
  }
}

export interface RunResult {
  processed: number;
  done: number;
  failed: number;
}

/**
 * Exécute tous les jobs dus. Appelé par le cron. Idempotent et résilient :
 * un job qui échoue est réessayé jusqu'à MAX_ATTEMPTS avant d'être marqué failed.
 */
export async function runDueJobs(): Promise<RunResult> {
  const due = await listDueJobs();
  let done = 0;
  let failed = 0;

  for (const job of due) {
    try {
      await executeJob(job);
      await updateJob(job.id, {
        status: "done",
        attempts: job.attempts + 1,
        lastError: null,
      });
      done++;
    } catch (error) {
      const attempts = job.attempts + 1;
      const giveUp = attempts >= MAX_ATTEMPTS;
      await updateJob(job.id, {
        status: giveUp ? "failed" : "pending",
        attempts,
        lastError: error instanceof Error ? error.message : "Erreur inconnue",
      });
      if (giveUp) failed++;
    }
  }

  const result = { processed: due.length, done, failed };
  // Trace de santé : permet à l'app de montrer que le cron tourne.
  await saveCronStatus({
    lastRunAt: new Date().toISOString(),
    ...result,
  }).catch(() => {});
  return result;
}

/** Santé du planificateur pour un compte (affichée dans l'app). */
export async function getSchedulerHealth(
  accountId: string,
): Promise<{ lastRunAt: string | null; pendingCount: number }> {
  const [status, pendingCount] = await Promise.all([
    getCronStatus(),
    countPendingJobs(accountId),
  ]);
  return { lastRunAt: status?.lastRunAt ?? null, pendingCount };
}
