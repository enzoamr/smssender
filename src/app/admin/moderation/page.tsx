import { ShieldAlert, TriangleAlert } from "lucide-react";
import { MessageStatusBadge } from "@/components/dashboard/message-status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getModerationData } from "@/lib/admin/service";

export const metadata = { title: "Modération" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminModerationPage() {
  const { riskyAccounts, recentFailures } = await getModerationData();

  return (
    <>
      <PageHeader
        title="Modération"
        description="Repérez les comptes à risque et inspectez les échecs d'envoi."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-amber-500" />
            Comptes à surveiller
          </CardTitle>
          <CardDescription>
            Comptes dont la délivrabilité est inférieure à 80 % (signal possible
            de spam ou de numéros invalides).
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {riskyAccounts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucun compte à risque détecté. 👍
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Compte</TableHead>
                  <TableHead className="text-right">Messages</TableHead>
                  <TableHead className="text-right">Échecs</TableHead>
                  <TableHead className="text-right">Délivrabilité</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riskyAccounts.map((a) => (
                  <TableRow key={a.accountId}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {a.total.toLocaleString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-destructive">
                      {a.failed.toLocaleString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className="border-transparent bg-destructive/10 tabular-nums text-destructive"
                      >
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TriangleAlert className="size-4 text-destructive" />
            Échecs récents
          </CardTitle>
          <CardDescription>
            Derniers messages en échec ou non délivrés, à inspecter.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {recentFailures.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucun échec récent.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Compte</TableHead>
                  <TableHead>Destinataire</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Erreur</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentFailures.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="max-w-[160px] truncate font-mono text-xs text-muted-foreground">
                      {m.account}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{m.to}</TableCell>
                    <TableCell>
                      <MessageStatusBadge status={m.status} />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {m.errorCode ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                      {formatDate(m.createdAt)}
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
