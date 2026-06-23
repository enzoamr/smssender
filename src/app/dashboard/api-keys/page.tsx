import { KeyRound, Plus } from "lucide-react";
import { CodeBlock } from "@/components/dashboard/code-block";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Clés API" };

const curlExample = `curl https://api.sendly.app/v1/messages \\
  -X POST \\
  -H "X-Api-Key: sk_live_••••••••••••a1b2" \\
  -H "Content-Type: application/json" \\
  -d '{
    "data": {
      "from": "Sendly",
      "to": ["+33612345678"],
      "text": "Bonjour depuis l'\\''API Sendly 👋"
    }
  }'`;

export default function ApiKeysPage() {
  return (
    <>
      <PageHeader
        title="Clés API"
        description="Authentifiez vos appels à l'API Sendly avec une clé secrète."
        actions={
          <Button disabled>
            <Plus />
            Créer une clé
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Vos clés</CardTitle>
          <CardDescription>
            Ne partagez jamais vos clés. La clé n'est affichée en entier qu'à la
            création.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <KeyRound className="size-4" />
              </div>
              <div>
                <p className="font-mono text-sm">sk_live_••••••••••••a1b2</p>
                <p className="text-xs text-muted-foreground">
                  Clé principale · créée le 12 juin 2026
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            >
              Active
            </Badge>
          </div>
        </CardContent>
      </Card>

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
