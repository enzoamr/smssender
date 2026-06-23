import Link from "next/link";
import {
  CheckCircle2,
  CreditCard,
  MessageSquare,
  Send,
  Users,
} from "lucide-react";
import { MessagesTable } from "@/components/dashboard/messages-table";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { DEMO_ACCOUNT_ID } from "@/lib/config";
import { getContactStats } from "@/lib/contacts/service";
import { getDashboardStats, listMessages } from "@/lib/messaging/service";

export default async function DashboardPage() {
  const accountId = (await getCurrentUser())?.accountId ?? DEMO_ACCOUNT_ID;
  const [stats, recent, contactStats] = await Promise.all([
    getDashboardStats(accountId),
    listMessages(accountId, 6),
    getContactStats(accountId),
  ]);

  // Tendance des envois : 7 derniers jours vs 7 jours précédents (données réelles).
  const last7 = stats.daily.slice(7).reduce((sum, d) => sum + d.sent, 0);
  const prev7 = stats.daily.slice(0, 7).reduce((sum, d) => sum + d.sent, 0);
  const msgTrend =
    prev7 === 0 ? null : Math.round(((last7 - prev7) / prev7) * 100);

  return (
    <>
      <PageHeader
        title="Vue d'ensemble"
        description="Suivez l'activité de vos envois et la délivrabilité en temps réel."
        actions={
          <Button render={<Link href="/dashboard/send" />}>
            <Send />
            Envoyer un SMS
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Messages envoyés"
          value={stats.totalSent.toLocaleString("fr-FR")}
          icon={MessageSquare}
          trend={
            msgTrend != null
              ? { value: `${msgTrend >= 0 ? "+" : ""}${msgTrend} %`, positive: msgTrend >= 0 }
              : undefined
          }
          hint="7 derniers jours"
        />
        <StatCard
          title="Taux de délivrabilité"
          value={`${stats.deliveryRate} %`}
          icon={CheckCircle2}
          hint="sur les messages finalisés"
        />
        <StatCard
          title="Crédits restants"
          value="—"
          icon={CreditCard}
          hint="bientôt (facturation Stripe)"
        />
        <StatCard
          title="Contacts"
          value={contactStats.total.toLocaleString("fr-FR")}
          icon={Users}
          trend={
            contactStats.recentWeek > 0
              ? { value: `+${contactStats.recentWeek}`, positive: true }
              : undefined
          }
          hint="cette semaine"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Activité d'envoi</CardTitle>
            <CardDescription>Messages envoyés et délivrés (14 jours)</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <OverviewChart data={stats.daily} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition des statuts</CardTitle>
            <CardDescription>Sur l'ensemble des messages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusBar
              label="Délivrés"
              value={stats.delivered}
              total={stats.totalSent}
              className="bg-emerald-500"
            />
            <StatusBar
              label="En file / en cours"
              value={stats.totalSent - stats.delivered - stats.failed}
              total={stats.totalSent}
              className="bg-amber-500"
            />
            <StatusBar
              label="Échecs"
              value={stats.failed}
              total={stats.totalSent}
              className="bg-destructive"
            />
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Segments totaux</span>
                <span className="font-medium tabular-nums">
                  {stats.totalSegments.toLocaleString("fr-FR")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Messages récents</CardTitle>
            <CardDescription>Vos derniers envois</CardDescription>
          </div>
          <Button variant="outline" size="sm" render={<Link href="/dashboard/messages" />}>
            Voir tout
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          <MessagesTable messages={recent} />
        </CardContent>
      </Card>
    </>
  );
}

function StatusBar({
  label,
  value,
  total,
  className,
}: {
  label: string;
  value: number;
  total: number;
  className: string;
}) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${className}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
