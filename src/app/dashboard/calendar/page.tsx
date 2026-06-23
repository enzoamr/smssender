import { CalendarView } from "@/components/dashboard/calendar-view";
import { PageHeader } from "@/components/dashboard/page-header";
import { SchedulerStatus } from "@/components/dashboard/scheduler-status";
import { listAppointmentsForAccount } from "@/lib/appointments/service";
import { getCurrentUser } from "@/lib/auth/session";
import { DEMO_ACCOUNT_ID } from "@/lib/config";
import { getSchedulerHealth } from "@/lib/scheduler/service";
import { getSettings } from "@/lib/settings/service";

export const metadata = { title: "Calendrier" };

export default async function CalendarPage() {
  const accountId = (await getCurrentUser())?.accountId ?? DEMO_ACCOUNT_ID;
  const [appointments, settings, health] = await Promise.all([
    listAppointmentsForAccount(accountId),
    getSettings(accountId),
    getSchedulerHealth(accountId),
  ]);

  return (
    <>
      <PageHeader
        title="Calendrier"
        description="Planifiez des rendez-vous et envoyez des rappels SMS automatiques."
      />
      <SchedulerStatus
        lastRunAt={health.lastRunAt}
        pendingCount={health.pendingCount}
      />
      <CalendarView
        appointments={appointments}
        defaultSender={settings.defaultSender}
      />
    </>
  );
}
