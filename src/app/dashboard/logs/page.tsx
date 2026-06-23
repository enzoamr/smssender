import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Placeholder } from "@/components/dashboard/placeholder";

export const metadata = { title: "Logs" };

export default function LogsPage() {
  return (
    <>
      <PageHeader
        title="Logs"
        description="Journal des requêtes API et des événements webhooks."
      />
      <Placeholder
        icon={ScrollText}
        title="Journaux d'activité"
        description="Inspectez chaque requête API (statut, latence, payload) et chaque webhook envoyé, avec relance manuelle en cas d'échec."
      />
    </>
  );
}
