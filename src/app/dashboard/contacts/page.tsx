import { Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Placeholder } from "@/components/dashboard/placeholder";

export const metadata = { title: "Contacts" };

export default function ContactsPage() {
  return (
    <>
      <PageHeader
        title="Contacts"
        description="Gérez vos répertoires, listes et segments de destinataires."
      />
      <Placeholder
        icon={Users}
        title="Gestion des contacts"
        description="Importez vos contacts (CSV), créez des listes et des segments, et gérez les opt-in / opt-out (STOP) pour rester conforme."
      />
    </>
  );
}
