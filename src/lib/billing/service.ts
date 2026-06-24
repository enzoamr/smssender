import { planName } from "./catalog";
import {
  adjustCredits,
  getBillingDoc,
  listLedgerEntries,
  patchBillingDoc,
} from "./store";
import { getStripe } from "./stripe";
import type {
  AccountBilling,
  BillingView,
  LedgerEntry,
  SubscriptionStatus,
} from "./types";

/**
 * Logique métier de facturation : solde, débit à l'envoi, approvisionnement
 * (packs / abonnement), abonnement Stripe. Tout passe par `adjustCredits` (store)
 * pour rester atomique et journalisé.
 */

/** Crédits offerts à la création du compte (pour tester avant d'acheter). */
const WELCOME_CREDITS = 50;

/** Récupère (ou crée, avec crédits de bienvenue) la facturation d'un compte. */
export async function getBilling(accountId: string): Promise<AccountBilling> {
  const existing = await getBillingDoc(accountId);
  if (existing) return existing;
  const { billing } = await adjustCredits({
    accountId,
    amount: WELCOME_CREDITS,
    reason: "welcome",
    detail: "Crédits de bienvenue",
    idempotencyKey: `welcome_${accountId}`,
  });
  return billing;
}

export async function getBillingView(accountId: string): Promise<BillingView> {
  const b = await getBilling(accountId);
  return {
    credits: b.credits,
    plan: b.plan,
    planName: planName(b.plan),
    subscriptionStatus: b.subscriptionStatus,
    currentPeriodEnd: b.currentPeriodEnd,
    hasSubscription: Boolean(b.stripeSubscriptionId),
  };
}

export async function getLedger(
  accountId: string,
  limit = 20,
): Promise<LedgerEntry[]> {
  return listLedgerEntries(accountId, limit);
}

/**
 * Débite le coût d'un envoi. Renvoie false si le solde est insuffisant
 * (l'appelant doit alors refuser l'envoi avec une 402).
 */
export async function chargeForSend(
  accountId: string,
  credits: number,
  detail: string,
): Promise<boolean> {
  if (credits <= 0) return true;
  await getBilling(accountId);
  const { ok } = await adjustCredits({
    accountId,
    amount: -credits,
    reason: "send",
    detail,
    requireFunds: true,
  });
  return ok;
}

/** Approvisionne des crédits (achat de pack ou quota d'abonnement). Idempotent. */
export async function grantCredits(params: {
  accountId: string;
  amount: number;
  reason: LedgerEntry["reason"];
  detail: string;
  idempotencyKey: string;
}): Promise<void> {
  await getBilling(params.accountId);
  await adjustCredits({
    accountId: params.accountId,
    amount: params.amount,
    reason: params.reason,
    detail: params.detail,
    idempotencyKey: params.idempotencyKey,
  });
}

/** Met à jour l'état d'abonnement (depuis le webhook Stripe). */
export async function applySubscription(
  accountId: string,
  fields: {
    plan: string | null;
    status: SubscriptionStatus | null;
    stripeSubscriptionId: string | null;
    currentPeriodEnd: string | null;
    stripeCustomerId?: string;
  },
): Promise<void> {
  await patchBillingDoc(accountId, {
    plan: fields.plan,
    subscriptionStatus: fields.status,
    stripeSubscriptionId: fields.stripeSubscriptionId,
    currentPeriodEnd: fields.currentPeriodEnd,
    ...(fields.stripeCustomerId
      ? { stripeCustomerId: fields.stripeCustomerId }
      : {}),
  });
}

/** Récupère (ou crée) le client Stripe rattaché au compte. */
export async function ensureStripeCustomer(
  accountId: string,
  email: string | null,
): Promise<string> {
  const billing = await getBilling(accountId);
  if (billing.stripeCustomerId) return billing.stripeCustomerId;
  const customer = await getStripe().customers.create({
    email: email ?? undefined,
    metadata: { accountId },
  });
  await patchBillingDoc(accountId, { stripeCustomerId: customer.id });
  return customer.id;
}
