import { randomUUID } from "crypto";
import { sendMessage } from "@/lib/messaging/service";
import {
  createJob,
  getJob,
  listDueJobs,
  listJobsByRef,
  listJobsForAccount,
  updateJob,
} from "./store";
import type {
  CampaignJobPayload,
  JobKind,
  JobRef,
  MessageJobPayload,
  ScheduledItem,
  ScheduledJob,
} from "./types";

/**
 * Logique de planification générique : créer des jobs, les annuler, et exécuter
 * ceux qui sont dus (appelé par le cron). Ajouter un nouveau type d'action =
 * ajouter un `case` dans `executeJob`, rien d'autre à changer ailleurs.
 */

const MAX_ATTEMPTS = 3;

function buildJob(
  accountId: string,
  runAt: Date | string,
  kind: JobKind,
  payload: MessageJobPayload | CampaignJobPayload,
  ref?: JobRef,
): ScheduledJob {
  const now = new Date().toISOString();
  return {
    id: `job_${randomUUID()}`,
    accountId,
    runAt: typeof runAt === "string" ? runAt : runAt.toISOString(),
    kind,
    payload: { ...payload } as Record<string, unknown>,
    status: "pending",
    refType: ref?.type ?? null,
    refId: ref?.id ?? null,
    attempts: 0,
    lastError: null,
    createdAt: now,
    updatedAt: now,
  };
}

/** Planifie l'envoi d'un message (un ou plusieurs destinataires) à une date donnée. */
export async function scheduleMessage(
  accountId: string,
  runAt: Date | string,
  payload: MessageJobPayload,
  ref?: JobRef,
): Promise<ScheduledJob> {
  return createJob(buildJob(accountId, runAt, "message", payload, ref));
}

/** Planifie le lancement d'une campagne à une date donnée. */
export async function scheduleCampaign(
  accountId: string,
  runAt: Date | string,
  payload: CampaignJobPayload,
  ref?: JobRef,
): Promise<ScheduledJob> {
  return createJob(buildJob(accountId, runAt, "campaign", payload, ref));
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

/** Annule un job précis — uniquement s'il appartient au compte et est en attente. */
export async function cancelJob(
  accountId: string,
  jobId: string,
): Promise<boolean> {
  const job = await getJob(jobId);
  if (!job || job.accountId !== accountId || job.status !== "pending") {
    return false;
  }
  await updateJob(jobId, { status: "cancelled" });
  return true;
}

/** Annule plusieurs jobs (ex. tous les rappels d'un RDV). Renvoie le nombre annulé. */
export async function cancelJobs(
  accountId: string,
  jobIds: string[],
): Promise<number> {
  const results = await Promise.all(
    jobIds.map((id) => cancelJob(accountId, id)),
  );
  return results.filter(Boolean).length;
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
    case "campaign": {
      const payload = job.payload as unknown as CampaignJobPayload;
      // Import dynamique pour éviter un cycle (campaigns importe le scheduler).
      const { launchCampaign } = await import("@/lib/campaigns/service");
      const result = await launchCampaign(job.accountId, {
        name: payload.name,
        from: payload.from,
        text: payload.text,
        targetList: payload.targetList,
        recipientPhones: payload.recipientPhones,
      });
      if (!result.ok) {
        throw new Error(result.error ?? "Échec de la campagne planifiée.");
      }
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

  return { processed: due.length, done, failed };
}

/* -------------------------------------------------------------------------- */
/*  Vue « Planifiés » : agrégation des jobs d'un compte pour l'UI.            */
/* -------------------------------------------------------------------------- */

function preview(text: string, max = 80): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function recipientsOf(to: string | string[]): string[] {
  return Array.isArray(to) ? to : [to];
}

/** Construit un item d'affichage à partir d'un groupe de jobs (même source). */
function buildItem(jobs: ScheduledJob[]): ScheduledItem {
  const first = jobs[0];
  const runAt = jobs
    .map((j) => j.runAt)
    .sort((a, b) => a.localeCompare(b))[0];
  const base = {
    key: first.refId ?? first.id,
    runAt,
    count: jobs.length,
    status: first.status,
    jobIds: jobs.map((j) => j.id),
    refType: first.refType,
    refId: first.refId,
  };

  if (first.kind === "campaign") {
    const p = first.payload as unknown as CampaignJobPayload;
    return {
      ...base,
      category: "campaign",
      title: p.name ? `Campagne : ${p.name}` : "Campagne",
      detail: preview(p.text ?? ""),
      recipientsLabel: p.targetLabel ?? "Cible",
    };
  }

  const p = first.payload as unknown as MessageJobPayload;
  const recips = recipientsOf(p.to ?? []);

  if (first.refType === "appointment") {
    return {
      ...base,
      category: "appointment",
      title: "Rappel de rendez-vous",
      detail: preview(p.text ?? ""),
      recipientsLabel: recips[0] ?? "",
    };
  }

  return {
    ...base,
    category: "send",
    title: "SMS planifié",
    detail: preview(p.text ?? ""),
    recipientsLabel:
      recips.length === 1
        ? recips[0]
        : `${recips.length} destinataires`,
  };
}

export interface AccountScheduled {
  /** À venir (en attente), regroupés par source, prochaine échéance d'abord. */
  upcoming: ScheduledItem[];
  /** Historique récent (exécutés, annulés, échoués), plus récents d'abord. */
  history: ScheduledItem[];
}

/**
 * Tout ce qui est planifié pour un compte, prêt pour l'onglet « Planifiés ».
 * Les jobs partageant une même source (ex. les rappels d'un RDV) sont regroupés.
 */
export async function listAccountScheduled(
  accountId: string,
): Promise<AccountScheduled> {
  const jobs = await listJobsForAccount(accountId);

  // À venir : on regroupe par source (refId) quand elle existe.
  const pending = jobs.filter((j) => j.status === "pending");
  const groups = new Map<string, ScheduledJob[]>();
  for (const job of pending) {
    const key = job.refId ?? job.id;
    const arr = groups.get(key) ?? [];
    arr.push(job);
    groups.set(key, arr);
  }
  const upcoming = Array.from(groups.values())
    .map(buildItem)
    .sort((a, b) => a.runAt.localeCompare(b.runAt));

  // Historique : jobs terminés, un par ligne, les plus récents d'abord.
  const history = jobs
    .filter((j) => j.status !== "pending")
    .sort((a, b) => b.runAt.localeCompare(a.runAt))
    .slice(0, 20)
    .map((j) => buildItem([j]));

  return { upcoming, history };
}
