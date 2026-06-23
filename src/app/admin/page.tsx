import { AlertTriangle, Building2, Layers, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPlatformStats } from "@/lib/admin/service";

export const metadata = { title: "Administration" };

export default async function AdminPage() {
  const stats = await getPlatformStats();

  return (
    <>
      <PageHeader
        title="Vue d'ensemble"
        description="Pilotage global de la plateforme : comptes, volumes et délivrabilité."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Comptes actifs"
          value={stats.accountCount.toLocaleString("fr-FR")}
          icon={Building2}
          hint="avec au moins un message"
        />
        <StatCard
          title="Messages (total)"
          value={stats.totalMessages.toLocaleString("fr-FR")}
          icon={MessageSquare}
          hint="sur la plateforme"
        />
        <StatCard
          title="Délivrabilité globale"
          value={`${stats.deliveryRate} %`}
          icon={AlertTriangle}
          hint="sur les messages finalisés"
        />
        <StatCard
          title="Segments totaux"
          value={stats.totalSegments.toLocaleString("fr-FR")}
          icon={Layers}
          hint="cumul facturable"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comptes par volume</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {stats.accounts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucune activité pour l&apos;instant.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Compte</TableHead>
                  <TableHead className="text-right">Messages</TableHead>
                  <TableHead className="text-right">Délivrés</TableHead>
                  <TableHead className="text-right">Échecs</TableHead>
                  <TableHead className="text-right">Délivrabilité</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.accounts.map((a) => (
                  <TableRow key={a.accountId}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {a.total.toLocaleString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                      {a.delivered.toLocaleString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-destructive">
                      {a.failed.toLocaleString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="tabular-nums">
                        {a.deliveryRate} %
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
