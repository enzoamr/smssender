import { Webhook } from "lucide-react";
import { CodeBlock } from "@/components/dashboard/code-block";
import { PageHeader } from "@/components/dashboard/page-header";
import { WebhooksManager } from "@/components/dashboard/webhooks-manager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { DEMO_ACCOUNT_ID } from "@/lib/config";
import { getEndpointView } from "@/lib/webhooks/service";

export const metadata = { title: "Webhooks" };

const payloadExample = `POST https://votre-domaine.com/webhooks/sendly
X-Sendly-Signature: <HMAC-SHA256 du corps avec votre secret>

{
  "data": {
    "id": "b04fc4d3-f232-46b7-b66b-538c0d4b3404",
    "request_id": null,
    "channel": "SMS",
    "status": "DELIVERED",
    "type": "STATUS"
  }
}`;

export default async function WebhooksPage() {
  const accountId = (await getCurrentUser())?.accountId ?? DEMO_ACCOUNT_ID;
  const endpoint = await getEndpointView(accountId);

  return (
    <>
      <PageHeader
        title="Webhooks"
        description="Recevez les rapports de statut (délivré, échec…) en temps réel."
      />

      <WebhooksManager endpoint={endpoint} />

      <Card>
        <CardHeader>
          <CardTitle>Comment ça marche</CardTitle>
          <CardDescription>
            À chaque changement d&apos;état d&apos;un message, Sendly envoie un{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">POST</code> à
            votre URL. Vérifiez l&apos;en-tête{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              X-Sendly-Signature
            </code>{" "}
            (HMAC-SHA256) pour garantir l&apos;authenticité de la requête.
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
