import { Webhook } from "lucide-react";
import { CodeBlock } from "@/components/dashboard/code-block";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Webhooks" };

const payloadExample = `POST https://votre-domaine.com/webhooks/sendly
X-Sendly-Signature: <HMAC-SHA256 du corps avec votre secret>

{
  "data": {
    "id": "b04fc4d3-f232-46b7-b66b-538c0d4b3404",
    "request_id": "votre-id-de-suivi",
    "channel": "SMS",
    "status": "DELIVERED",
    "type": "STATUS"
  }
}`;

export default function WebhooksPage() {
  return (
    <>
      <PageHeader
        title="Webhooks"
        description="Recevez les rapports de statut (délivré, échec…) en temps réel."
      />

      <Card>
        <CardHeader>
          <CardTitle>Comment ça marche</CardTitle>
          <CardDescription>
            À chaque changement d'état d'un message, Sendly envoie un{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">POST</code> à
            votre URL. Vérifiez l'en-tête{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              X-Sendly-Signature
            </code>{" "}
            (HMAC-SHA256) pour garantir l'authenticité de la requête.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
            <Webhook className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Statuts possibles :{" "}
              <span className="font-medium text-foreground">QUEUED</span>,{" "}
              <span className="font-medium text-foreground">SENT</span>,{" "}
              <span className="font-medium text-foreground">DELIVERED</span>,{" "}
              <span className="font-medium text-foreground">UNDELIVERED</span>,{" "}
              <span className="font-medium text-foreground">FAILED</span>.
            </p>
          </div>
          <CodeBlock>{payloadExample}</CodeBlock>
        </CardContent>
      </Card>
    </>
  );
}
