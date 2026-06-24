import { PageHeader } from "@/components/dashboard/page-header";
import { BillingManager } from "@/components/dashboard/billing-manager";
import { PACKS, PLANS, priceIdFor } from "@/lib/billing/catalog";
import { getBillingView, getLedger } from "@/lib/billing/service";
import { isBillingEnabled } from "@/lib/billing/stripe";
import { getCurrentUser } from "@/lib/auth/session";
import { DEMO_ACCOUNT_ID } from "@/lib/config";

export const metadata = { title: "Facturation" };

/** Offre allégée et sérialisable pour le client (id, libellés, disponibilité). */
function toCard(o: (typeof PLANS)[number]) {
  return {
    id: o.id,
    name: o.name,
    credits: o.credits,
    price: o.price,
    description: o.description,
    available: Boolean(priceIdFor(o)),
  };
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const accountId = (await getCurrentUser())?.accountId ?? DEMO_ACCOUNT_ID;
  const [view, ledger, { status }] = await Promise.all([
    getBillingView(accountId),
    getLedger(accountId),
    searchParams,
  ]);

  return (
    <>
      <PageHeader
        title="Facturation"
        description="Solde de crédits, abonnement et recharges — paiement sécurisé par Stripe."
      />
      <BillingManager
        view={view}
        ledger={ledger}
        plans={PLANS.map(toCard)}
        packs={PACKS.map(toCard)}
        enabled={isBillingEnabled()}
        initialStatus={status ?? null}
      />
    </>
  );
}
