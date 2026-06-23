import { ApiKeysManager } from "@/components/dashboard/api-keys-manager";
import { CodeBlock } from "@/components/dashboard/code-block";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listApiKeysForAccount } from "@/lib/api-keys/service";
import { getCurrentUser } from "@/lib/auth/session";
import { DEMO_ACCOUNT_ID } from "@/lib/config";

export const metadata = { title: "Clés API" };

const curlExample = `curl https://smssender-xi.vercel.app/api/v1/messages \\
  -X POST \\
  -H "X-Api-Key: sk_live_votre_cle" \\
  -H "Content-Type: application/json" \\
  -d '{
    "data": {
      "from": "Sendly",
      "to": ["+33612345678"],
      "text": "Bonjour depuis l'\\''API Sendly 👋"
    }
  }'`;

export default async function ApiKeysPage() {
  const accountId = (await getCurrentUser())?.accountId ?? DEMO_ACCOUNT_ID;
  const keys = await listApiKeysForAccount(accountId);

  return (
    <>
      <PageHeader
        title="Clés API"
        description="Authentifiez vos appels à l'API Sendly avec une clé secrète."
      />

      <ApiKeysManager initialKeys={keys} />

      <Card>
        <CardHeader>
          <CardTitle>Démarrage rapide</CardTitle>
          <CardDescription>
            Envoyez votre premier SMS via l'API publique{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              POST /api/v1/messages
            </code>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock>{curlExample}</CodeBlock>
        </CardContent>
      </Card>
    </>
  );
}
