import { randomUUID } from "crypto";
import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import type { AccountBilling, LedgerEntry } from "./types";

/**
 * Persistance de la facturation : solde + abonnement (collection `billing`,
 * un doc par compte) et mouvements de crédits (collection `credit_ledger`).
 *
 * Les variations de solde passent par `adjustCredits`, qui s'exécute dans une
 * TRANSACTION Firestore : lecture du solde, contrôle, écriture du nouveau solde
 * et du mouvement, le tout atomiquement (pas de race condition sur le solde).
 */

const BILLING = "billing";
const LEDGER = "credit_ledger";

const memoryBilling = new Map<string, AccountBilling>();
const memoryLedger: LedgerEntry[] = [];

function isFirestore(): boolean {
  return isAdminConfigured();
}

function defaultDoc(accountId: string): AccountBilling {
  const now = new Date().toISOString();
  return {
    accountId,
    credits: 0,
    plan: null,
    subscriptionStatus: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getBillingDoc(
  accountId: string,
): Promise<AccountBilling | null> {
  if (isFirestore()) {
    const doc = await getAdminDb().collection(BILLING).doc(accountId).get();
    return doc.exists ? (doc.data() as AccountBilling) : null;
  }
  return memoryBilling.get(accountId) ?? null;
}

/** Met à jour les champs d'abonnement/customer (jamais le solde — voir adjustCredits). */
export async function patchBillingDoc(
  accountId: string,
  patch: Partial<AccountBilling>,
): Promise<AccountBilling> {
  const current = (await getBillingDoc(accountId)) ?? defaultDoc(accountId);
  const updated: AccountBilling = {
    ...current,
    ...patch,
    accountId,
    updatedAt: new Date().toISOString(),
  };
  if (isFirestore()) {
    await getAdminDb().collection(BILLING).doc(accountId).set(updated);
  } else {
    memoryBilling.set(accountId, updated);
  }
  return updated;
}

export interface AdjustParams {
  accountId: string;
  /** Variation du solde (positive = crédit, négative = débit). */
  amount: number;
  reason: LedgerEntry["reason"];
  detail?: string | null;
  /** Pour un débit : échoue si le solde deviendrait négatif. */
  requireFunds?: boolean;
  /** Clé d'idempotence (ex. id d'événement Stripe) : rejoue ignoré. */
  idempotencyKey?: string;
}

export interface AdjustResult {
  ok: boolean;
  /** True si l'opération avait déjà été appliquée (idempotence). */
  duplicate?: boolean;
  billing: AccountBilling;
}

/**
 * Modifie le solde de façon atomique et journalise le mouvement.
 * Renvoie ok=false (sans rien écrire) si requireFunds et solde insuffisant.
 */
export async function adjustCredits(params: AdjustParams): Promise<AdjustResult> {
  const { accountId, amount, reason, detail, requireFunds, idempotencyKey } =
    params;
  const ledgerId = idempotencyKey
    ? `led_${idempotencyKey}`
    : `led_${randomUUID()}`;
  const now = new Date().toISOString();

  if (isFirestore()) {
    const db = getAdminDb();
    const billingRef = db.collection(BILLING).doc(accountId);
    const ledgerRef = db.collection(LEDGER).doc(ledgerId);

    return db.runTransaction<AdjustResult>(async (tx) => {
      const billingSnap = await tx.get(billingRef);
      if (idempotencyKey) {
        const ledgerSnap = await tx.get(ledgerRef);
        if (ledgerSnap.exists) {
          const current =
            (billingSnap.data() as AccountBilling) ?? defaultDoc(accountId);
          return { ok: true, duplicate: true, billing: current };
        }
      }
      const current = billingSnap.exists
        ? (billingSnap.data() as AccountBilling)
        : defaultDoc(accountId);
      const nextBalance = current.credits + amount;
      if (requireFunds && nextBalance < 0) {
        return { ok: false, billing: current };
      }
      const updated: AccountBilling = {
        ...current,
        credits: nextBalance,
        updatedAt: now,
      };
      tx.set(billingRef, updated);
      tx.set(ledgerRef, {
        id: ledgerId,
        accountId,
        amount,
        balanceAfter: nextBalance,
        reason,
        detail: detail ?? null,
        createdAt: now,
      } satisfies LedgerEntry);
      return { ok: true, billing: updated };
    });
  }

  // Mode mémoire (démo) : pas de concurrence réelle.
  if (idempotencyKey && memoryLedger.some((l) => l.id === ledgerId)) {
    return {
      ok: true,
      duplicate: true,
      billing: memoryBilling.get(accountId) ?? defaultDoc(accountId),
    };
  }
  const current = memoryBilling.get(accountId) ?? defaultDoc(accountId);
  const nextBalance = current.credits + amount;
  if (requireFunds && nextBalance < 0) {
    return { ok: false, billing: current };
  }
  const updated: AccountBilling = { ...current, credits: nextBalance, updatedAt: now };
  memoryBilling.set(accountId, updated);
  memoryLedger.unshift({
    id: ledgerId,
    accountId,
    amount,
    balanceAfter: nextBalance,
    reason,
    detail: detail ?? null,
    createdAt: now,
  });
  return { ok: true, billing: updated };
}

export async function listLedgerEntries(
  accountId: string,
  limit = 20,
): Promise<LedgerEntry[]> {
  if (isFirestore()) {
    const snap = await getAdminDb()
      .collection(LEDGER)
      .where("accountId", "==", accountId)
      .limit(200)
      .get();
    return snap.docs
      .map((d) => d.data() as LedgerEntry)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }
  return memoryLedger
    .filter((l) => l.accountId === accountId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

/** Retrouve un compte par son customer Stripe (pour le webhook). */
export async function findAccountByCustomer(
  stripeCustomerId: string,
): Promise<AccountBilling | null> {
  if (isFirestore()) {
    const snap = await getAdminDb()
      .collection(BILLING)
      .where("stripeCustomerId", "==", stripeCustomerId)
      .limit(1)
      .get();
    return snap.empty ? null : (snap.docs[0].data() as AccountBilling);
  }
  for (const b of memoryBilling.values()) {
    if (b.stripeCustomerId === stripeCustomerId) return b;
  }
  return null;
}
