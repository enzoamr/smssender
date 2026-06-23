import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/auth/session";

// Données propres à chaque utilisateur : jamais de cache statique partagé.
export const dynamic = "force-dynamic";

// Solde de démonstration (à brancher sur le compte réel).
const DEMO_CREDITS = 8450;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <SidebarProvider>
      <AppSidebar area="client" />
      <SidebarInset>
        <Topbar credits={DEMO_CREDITS} />
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
