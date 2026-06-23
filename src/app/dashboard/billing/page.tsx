import { CreditCard } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Placeholder } from "@/components/dashboard/placeholder";

export const metadata = { title: "Facturation" };

export default function BillingPage() {
  return (
    <>
      <PageHeader
        title="Facturation"
        description="Abonnement, crédits SMS, factures et moyens de paiement."
      />
      <Placeholder
        icon={CreditCard}
        title="Facturation Stripe"
        description="Gérez votre abonnement, rechargez vos crédits, suivez votre consommation à l'usage et téléchargez vos factures — propulsé par Stripe Billing."
      />
    </>
  );
}
