import { PageHeader } from "@/components/dashboard/page-header";
import { SendSmsForm } from "@/components/dashboard/send-sms-form";

export const metadata = {
  title: "Envoyer un SMS",
};

export default function SendPage() {
  return (
    <>
      <PageHeader
        title="Envoyer un SMS"
        description="Composez et envoyez un message immédiatement via l'API."
      />
      <SendSmsForm />
    </>
  );
}
