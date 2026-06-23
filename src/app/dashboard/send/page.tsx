import { PageHeader } from "@/components/dashboard/page-header";
import { SendSmsForm } from "@/components/dashboard/send-sms-form";
import { getCurrentUser } from "@/lib/auth/session";
import { DEMO_ACCOUNT_ID } from "@/lib/config";
import { getSettings } from "@/lib/settings/service";

export const metadata = {
  title: "Envoyer un SMS",
};

export default async function SendPage() {
  const accountId = (await getCurrentUser())?.accountId ?? DEMO_ACCOUNT_ID;
  const { defaultSender } = await getSettings(accountId);

  return (
    <>
      <PageHeader
        title="Envoyer un SMS"
        description="Composez et envoyez un message immédiatement via l'API."
      />
      <SendSmsForm defaultSender={defaultSender} />
    </>
  );
}
