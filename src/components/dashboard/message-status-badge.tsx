import { Badge } from "@/components/ui/badge";
import type { MessageStatus } from "@/lib/messaging/types";

const STYLES: Record<MessageStatus, { label: string; className: string }> = {
  QUEUED: {
    label: "En file",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  SENDING: {
    label: "Envoi",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  SENT: {
    label: "Envoyé",
    className: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  DELIVERED: {
    label: "Délivré",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  UNDELIVERED: {
    label: "Non délivré",
    className: "bg-destructive/10 text-destructive",
  },
  FAILED: {
    label: "Échec",
    className: "bg-destructive/10 text-destructive",
  },
};

export function MessageStatusBadge({ status }: { status: MessageStatus }) {
  const s = STYLES[status];
  return (
    <Badge variant="outline" className={`border-transparent ${s.className}`}>
      {s.label}
    </Badge>
  );
}
