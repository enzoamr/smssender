"use server";

import { findOffer, priceIdFor } from "@/lib/billing/catalog";
import { ensureStripeCustomer } from "@/lib/billing/service";
import { appBaseUrl, getStripe, isBillingEnabled } from "@/lib/billing/stripe";
import { getCurrentUser } from "@/lib/auth/session";
import { DEMO_ACCOUNT_ID } from "@/lib/config";

export interface CheckoutResult {
  ok: boolean;
  url?: string;
  error?: string;
}

/**
 * Crée une session Stripe Checkout pour une offre (plan ou pack) et renvoie
 * l'URL de paiement. Le client redirige ensuite vers Stripe.
 */
export async function startCheckoutAction(
  offerId: string,
): Promise<CheckoutResult> {
  if (!isBillingEnabled()) {
    return { ok: false, error: "Facturation non configurée." };
  }
  const offer = findOffer(offerId);
  if (!offer) return { ok: false, error: "Offre inconnue." };
  const priceId = priceIdFor(offer);
  if (!priceId) {
    return { ok: false, error: "Cette offre n'est pas encore disponible." };
  }

  const user = await getCurrentUser();
  const accountId = user?.accountId ?? DEMO_ACCOUNT_ID;

  try {
    const customerId = await ensureStripeCustomer(accountId, user?.email ?? null);
    const base = appBaseUrl();
    const metadata = {
      accountId,
      offerId: offer.id,
      credits: String(offer.credits),
      kind: offer.kind,
    };

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: offer.kind === "plan" ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/dashboard/billing?status=success`,
      cancel_url: `${base}/dashboard/billing?status=cancel`,
      metadata,
      // L'abonnement porte les mêmes métadonnées : les renouvellements pourront
      // accorder les crédits sans dépendre du détail des lignes de facture.
      ...(offer.kind === "plan"
        ? { subscription_data: { metadata } }
        : {}),
    });

    return session.url
      ? { ok: true, url: session.url }
      : { ok: false, error: "Échec de la création de la session de paiement." };
  } catch (error) {
    console.error("[billing] checkout", error);
    return { ok: false, error: "Erreur lors de l'ouverture du paiement." };
  }
}

/** Ouvre le portail client Stripe (gérer/annuler l'abonnement, factures). */
export async function openPortalAction(): Promise<CheckoutResult> {
  if (!isBillingEnabled()) {
    return { ok: false, error: "Facturation non configurée." };
  }
  const user = await getCurrentUser();
  const accountId = user?.accountId ?? DEMO_ACCOUNT_ID;
  try {
    const customerId = await ensureStripeCustomer(accountId, user?.email ?? null);
    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appBaseUrl()}/dashboard/billing`,
    });
    return { ok: true, url: session.url };
  } catch (error) {
    console.error("[billing] portal", error);
    return { ok: false, error: "Portail indisponible." };
  }
}
