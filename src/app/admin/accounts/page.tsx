import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPlatformStats } from "@/lib/admin/service";

export const metadata = { title: "Comptes clients" };

export default async function AdminAccountsPage() {
  const { accounts } = await getPlatformStats();

  return (
    <>
      <PageHeader
        title="Comptes clients"
        description="Tous les comptes de la plateforme, classés par volume d'envoi."
      />

      <Card>
        <CardContent className="px-0">
          {accounts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucun compte actif pour l&apos;instant.
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
                {accounts.map((a) => (
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
