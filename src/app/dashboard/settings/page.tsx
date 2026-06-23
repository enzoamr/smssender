import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsForm } from "@/components/dashboard/settings-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { DEMO_ACCOUNT_ID } from "@/lib/config";
import { getSettings } from "@/lib/settings/service";

export const metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const accountId = user?.accountId ?? DEMO_ACCOUNT_ID;
  const settings = await getSettings(accountId);

  return (
    <>
      <PageHeader
        title="Paramètres"
        description="Profil, organisation et préférences d'envoi."
      />

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Vos informations de connexion.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ProfileField label="Nom" value={user?.name ?? "—"} />
          <ProfileField label="Email" value={user?.email ?? "—"} />
          {user?.demo ? (
            <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Mode démo — connectez Firebase pour gérer un vrai compte.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <SettingsForm settings={settings} />
    </>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
