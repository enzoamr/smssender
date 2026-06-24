/**
 * Modèle de facturation : solde de crédits + abonnement Stripe par compte.
 *
 * Unité : 1 crédit = 1 segment SMS. Un envoi vers N destinataires d'un message
 * à S segments coûte N × S crédits. Les crédits sont approvisionnés par des
 * packs (achat ponctuel) ou par l'abonnement mensuel (quota renouvelé).
 */

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled";

export interface AccountBilling {
  accountId: string;
  /** Solde de crédits disponible. */
  credits: number;
  /** Id du plan d'abonnement (catalogue), ou null si pas d'abonnement. */
  plan: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  /** Fin de la période d'abonnement en cours (ISO 8601). */
  currentPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Mouvement de crédits (audit) : + approvisionnement, − consommation. */
export interface LedgerEntry {
  id: string;
  accountId: string;
  /** Variation (positive = crédit, négative = débit). */
  amount: number;
  /** Solde après l'opération. */
  balanceAfter: number;
  reason: "purchase" | "subscription" | "send" | "welcome" | "adjustment";
  detail: string | null;
  createdAt: string;
}

/** Vue exposée à l'UI de facturation. */
export interface BillingView {
  credits: number;
  plan: string | null;
  planName: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  currentPeriodEnd: string | null;
  hasSubscription: boolean;
}
