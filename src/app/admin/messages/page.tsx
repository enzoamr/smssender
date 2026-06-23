import { MessageStatusBadge } from "@/components/dashboard/message-status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listRecentPlatformMessages } from "@/lib/admin/service";

export const metadata = { title: "Messages" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminMessagesPage() {
  const messages = await listRecentPlatformMessages();

  return (
    <>
      <PageHeader
        title="Messages"
        description="Flux global des derniers messages, tous comptes confondus (destinataires masqués)."
      />

      <Card>
        <CardContent className="px-0">
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucun message sur la plateforme pour l&apos;instant.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Compte</TableHead>
                  <TableHead>Expéditeur</TableHead>
                  <TableHead>Destinataire</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">SMS</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="max-w-[160px] truncate font-mono text-xs text-muted-foreground">
                      {m.account}
                    </TableCell>
                    <TableCell className="text-sm">{m.from}</TableCell>
                    <TableCell className="font-mono text-xs">{m.to}</TableCell>
                    <TableCell>
                      <MessageStatusBadge status={m.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {m.segmentCount}
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
