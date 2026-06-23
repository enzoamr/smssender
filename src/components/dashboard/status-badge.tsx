import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MessageStatus } from "@/lib/messaging/types";

const STATUS_CONFIG: Record<MessageStatus, { label: string; className: string }> =
  {
    QUEUED: {
      label: "En file",
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    SENDING: {
      label: "Envoi…",
      className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
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
      className: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    },
    FAILED: {
      label: "Échec",
      className: "bg-destructive/10 text-destructive",
    },
  };

export function StatusBadge({ status }: { status: MessageStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", config.className)}
    >
      {config.label}
    </Badge>
  );
}
