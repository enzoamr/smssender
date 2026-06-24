import { PageHeader } from "@/components/dashboard/page-header";
import { ScheduledManager } from "@/components/dashboard/scheduled-manager";
import { getCurrentUser } from "@/lib/auth/session";
import { DEMO_ACCOUNT_ID } from "@/lib/config";
import { listAccountScheduled } from "@/lib/scheduler/service";

export const metadata = { title: "Planifiés" };

export default async function ScheduledPage() {
  const accountId = (await getCurrentUser())?.accountId ?? DEMO_ACCOUNT_ID;
  const { upcoming, history } = await listAccountScheduled(accountId);

  return (
    <>
      <PageHeader
        title="Planifiés"
        description="Tout ce qui est programmé — SMS, campagnes et rappels de rendez-vous — au même endroit."
      />
      <ScheduledManager upcoming={upcoming} history={history} />
    </>
  );
}
