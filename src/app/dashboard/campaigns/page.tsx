import { Megaphone } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Placeholder } from "@/components/dashboard/placeholder";

export const metadata = { title: "Campagnes" };

export default function CampaignsPage() {
  return (
    <>
      <PageHeader
        title="Campagnes"
        description="Planifiez et suivez vos envois groupés en masse."
      />
      <Placeholder
        icon={Megaphone}
        title="Campagnes SMS"
        description="Créez des campagnes vers vos listes, programmez l'envoi, suivez la délivrabilité en temps réel et gérez les renvois automatiques."
      />
    </>
  );
}
