import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Message } from "@/lib/messaging/types";
import { StatusBadge } from "./status-badge";

export function MessagesTable({ messages }: { messages: Message[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Destinataire</TableHead>
          <TableHead>Message</TableHead>
          <TableHead className="hidden md:table-cell">Statut</TableHead>
          <TableHead className="hidden text-right lg:table-cell">Seg.</TableHead>
          <TableHead className="text-right">Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {messages.map((message) => (
          <TableRow key={message.id}>
            <TableCell className="font-medium tabular-nums whitespace-nowrap">
              {message.to}
            </TableCell>
            <TableCell className="max-w-[260px] truncate text-muted-foreground">
              {message.text}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <StatusBadge status={message.status} />
            </TableCell>
            <TableCell className="hidden text-right tabular-nums lg:table-cell">
              {message.segmentCount}
            </TableCell>
            <TableCell className="text-right text-xs whitespace-nowrap text-muted-foreground">
              {formatDistanceToNow(new Date(message.createdAt), {
                addSuffix: true,
                locale: fr,
              })}
            </TableCell>
          </TableRow>
        ))}
        {messages.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={5}
              className="h-24 text-center text-muted-foreground"
            >
              Aucun message pour le moment.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
