import { AlertTriangle, Building2, DollarSign, MessageSquare } from "lucide-react";
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

export const metadata = { title: "Administration" };

const accounts = [
  { name: "Vanguard", plan: "Scale", messages: 184_320, status: "Actif" },
  { name: "Acme Corp", plan: "Pro", messages: 92_140, status: "Actif" },
  { name: "Boutique Lina", plan: "Starter", messages: 12_880, status: "Actif" },
  { name: "RimaTech", plan: "Pro", messages: 8_410, status: "Suspendu" },
  { name: "Studio Nova", plan: "Starter", messages: 2_330, status: "Actif" },
];

export default function AdminPage() {
  return (
    <>
      <PageHeader
        title="Vue d'ensemble"
        description="Pilotage global de la plateforme : comptes, volumes et revenus."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Comptes clients"
          value="128"
          icon={Building2}
          trend={{ value: "+9", positive: true }}
          hint="ce mois-ci"
        />
        <StatCard
          title="Messages (30 j)"
          value="1,24 M"
          icon={MessageSquare}
          trend={{ value: "+18 %", positive: true }}
          hint="vs. mois dernier"
        />
        <StatCard
          title="MRR"
          value="14 820 €"
          icon={DollarSign}
          trend={{ value: "+6,2 %", positive: true }}
          hint="revenu mensuel récurrent"
        />
        <StatCard
          title="Taux d'échec global"
          value="2,1 %"
          icon={AlertTriangle}
          trend={{ value: "-0,4 pt", positive: true }}
          hint="sur 30 jours"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Principaux comptes</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Compte</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Messages (30 j)</TableHead>
                <TableHead className="text-right">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.name}>
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{account.plan}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {account.messages.toLocaleString("fr-FR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={
                        account.status === "Actif"
                          ? "border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-transparent bg-destructive/10 text-destructive"
                      }
                    >
                      {account.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
