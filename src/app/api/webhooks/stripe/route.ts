import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { applySubscription, grantCredits } from "@/lib/billing/service";
import { getStripe, isBillingEnabled } from "@/lib/billing/stripe";
import type { SubscriptionStatus } from "@/lib/billing/types";

/**
 * Webhook Stripe : c'est lui qui APPROVISIONNE réellement les crédits, une fois
 * le paiement confirmé par Stripe (jamais côté client).
 *
 * Sécurité : la signature `Stripe-Signature` est vérifiée avec
 * STRIPE_WEBHOOK_SECRET. Chaque approvisionnement est idempotent (clé = id de
 * l'événement) pour tolérer les rejeux de Stripe.
 *
 * Tout est piloté par les MÉTADONNÉES (accountId, offerId, credits) posées à la
 * création de la session/abonnement — robuste face aux évolutions de l'API.
 */

export const runtime = "nodejs";

function mapStatus(status: string): SubscriptionStatus | null {
  switch (status) {
    case "active":
    case "trialing":
    case "past_due":
    case "canceled":
      return status;
    case "unpaid":
      return "past_due";
    case "incomplete_expired":
      return "canceled";
    default:
      return null;
  }
}

/** Extraction défensive de la fin de période (l'emplacement varie selon l'API). */
function periodEnd(sub: Stripe.Subscription): string | null {
  const raw =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sub as any).current_period_end ??
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sub as any).items?.data?.[0]?.current_period_end;
  return typeof raw === "number" ? new Date(raw * 1000).toISOString() : null;
}

export async function POST(request: Request) {
  if (!isBillingEnabled()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  const raw = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    if (!secret || !signature) throw new Error("signature/secret manquant");
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const accountId = s.metadata?.accountId;
        const credits = Number(s.metadata?.credits ?? 0);
        if (!accountId) break;

        // Approvisionnement (pack OU 1re période d'abonnement).
        if (credits > 0) {
          await grantCredits({
            accountId,
            amount: credits,
            reason: s.mode === "subscription" ? "subscription" : "purchase",
            detail:
              s.mode === "subscription"
                ? "Abonnement souscrit"
                : "Achat de crédits",
            idempotencyKey: `evt_${event.id}`,
          });
        }

        // Pour un abonnement : enregistrer plan + ids + période.
        if (s.mode === "subscription" && s.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            String(s.subscription),
          );
          await applySubscription(accountId, {
            plan: s.metadata?.offerId ?? null,
            status: mapStatus(sub.status),
            stripeSubscriptionId: sub.id,
            currentPeriodEnd: periodEnd(sub),
            stripeCustomerId: String(s.customer),
          });
        }
        break;
      }

      case "invoice.paid": {
        const inv = event.data.object as Stripe.Invoice;
        // Seuls les RENOUVELLEMENTS : la 1re facture est déjà gérée ci-dessus.
        if (inv.billing_reason !== "subscription_cycle") break;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subId = (inv as any).subscription;
        if (!subId) break;
        const sub = await stripe.subscriptions.retrieve(String(subId));
        const accountId = sub.metadata?.accountId;
        const credits = Number(sub.metadata?.credits ?? 0);
        if (accountId && credits > 0) {
          await grantCredits({
            accountId,
            amount: credits,
            reason: "subscription",
            detail: "Renouvellement d'abonnement",
            idempotencyKey: `evt_${event.id}`,
          });
          await applySubscription(accountId, {
            plan: sub.metadata?.offerId ?? null,
            status: mapStatus(sub.status),
            stripeSubscriptionId: sub.id,
            currentPeriodEnd: periodEnd(sub),
          });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const accountId = sub.metadata?.accountId;
        if (!accountId) break;
        const ended =
          event.type === "customer.subscription.deleted" ||
          sub.status === "canceled";
        await applySubscription(accountId, {
          plan: ended ? null : (sub.metadata?.offerId ?? null),
          status: ended ? "canceled" : mapStatus(sub.status),
          stripeSubscriptionId: ended ? null : sub.id,
          currentPeriodEnd: ended ? null : periodEnd(sub),
        });
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error("[stripe webhook]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
