import { ContactsManager } from "@/components/dashboard/contacts-manager";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentUser } from "@/lib/auth/session";
import { DEMO_ACCOUNT_ID } from "@/lib/config";
import { listContactsForAccount } from "@/lib/contacts/service";

export const metadata = { title: "Contacts" };

export default async function ContactsPage() {
  const accountId = (await getCurrentUser())?.accountId ?? DEMO_ACCOUNT_ID;
  const contacts = await listContactsForAccount(accountId);

  return (
    <>
      <PageHeader
        title="Contacts"
        description="Gérez vos destinataires, listes et l'opt-out (STOP) pour rester conforme."
      />
      <ContactsManager initialContacts={contacts} />
    </>
  );
}
