import { CalendarView } from "@/components/dashboard/calendar-view";
import { PageHeader } from "@/components/dashboard/page-header";
import { listAppointmentsForAccount } from "@/lib/appointments/service";
import { getCurrentUser } from "@/lib/auth/session";
import { DEMO_ACCOUNT_ID } from "@/lib/config";
import { getSettings } from "@/lib/settings/service";

export const metadata = { title: "Calendrier" };

export default async function CalendarPage() {
  const accountId = (await getCurrentUser())?.accountId ?? DEMO_ACCOUNT_ID;
  const [appointments, settings] = await Promise.all([
    listAppointmentsForAccount(accountId),
    getSettings(accountId),
  ]);

  return (
    <>
      <PageHeader
        title="Calendrier"
        description="Planifiez des rendez-vous et envoyez des rappels SMS automatiques."
      />
      <CalendarView
        appointments={appointments}
        defaultSender={settings.defaultSender}
      />
    </>
  );
}
