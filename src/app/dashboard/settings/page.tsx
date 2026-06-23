import { Settings } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Placeholder } from "@/components/dashboard/placeholder";

export const metadata = { title: "Paramètres" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Paramètres"
        description="Profil, organisation, membres de l'équipe et sécurité."
      />
      <Placeholder
        icon={Settings}
        title="Paramètres du compte"
        description="Gérez votre profil, votre organisation, les invitations d'équipe, les rôles et la sécurité (2FA, sessions)."
      />
    </>
  );
}
