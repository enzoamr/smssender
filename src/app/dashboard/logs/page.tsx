import { LogsViewer } from "@/components/dashboard/logs-viewer";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentUser } from "@/lib/auth/session";
import { DEMO_ACCOUNT_ID } from "@/lib/config";
import { listLogsForAccount } from "@/lib/logs/service";

export const metadata = { title: "Logs" };

export default async function LogsPage() {
  const accountId = (await getCurrentUser())?.accountId ?? DEMO_ACCOUNT_ID;
  const logs = await listLogsForAccount(accountId);

  return (
    <>
      <PageHeader
        title="Logs"
        description="Journal des requêtes API et des livraisons de webhooks."
      />
      <LogsViewer logs={logs} />
    </>
  );
}
