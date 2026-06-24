import { CampaignsManager } from "@/components/dashboard/campaigns-manager";
import { PageHeader } from "@/components/dashboard/page-header";
import { listCampaignsForAccount } from "@/lib/campaigns/service";
import { getCurrentUser } from "@/lib/auth/session";
import { DEMO_ACCOUNT_ID } from "@/lib/config";
import {
  listContactLists,
  listContactsForAccount,
} from "@/lib/contacts/service";

export const metadata = { title: "Campagnes" };

export default async function CampaignsPage() {
  const accountId = (await getCurrentUser())?.accountId ?? DEMO_ACCOUNT_ID;
  const [campaigns, lists, contacts] = await Promise.all([
    listCampaignsForAccount(accountId),
    listContactLists(accountId),
    listContactsForAccount(accountId),
  ]);
  // Seuls les contacts abonnés peuvent être ciblés (opt-out STOP exclus).
  const selectableContacts = contacts.filter((c) => c.status === "subscribed");

  return (
    <>
      <PageHeader
        title="Campagnes"
        description="Envoyez un message à toute une liste de contacts, en un clic."
      />
      <CampaignsManager
        initialCampaigns={campaigns}
        lists={lists}
        contacts={selectableContacts}
      />
    </>
  );
}
