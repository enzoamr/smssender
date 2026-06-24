import Stripe from "stripe";

/**
 * Client Stripe partagé (initialisé paresseusement) et détection de l'activation.
 *
 * La facturation n'est ACTIVE que si `STRIPE_SECRET_KEY` est défini. Sans elle
 * (dev / démo), les envois ne sont ni débités ni bloqués — la plateforme reste
 * pleinement utilisable, exactement comme pour Firebase/Twilio.
 */

let client: Stripe | null = null;

export function isBillingEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY manquant : facturation non configurée.");
  }
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return client;
}

/** URL de base de l'app, pour les redirections Checkout (succès/annulation). */
export function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    "https://smssender-xi.vercel.app"
  );
}
