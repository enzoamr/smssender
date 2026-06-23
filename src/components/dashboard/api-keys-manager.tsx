"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  Check,
  Copy,
  KeyRound,
  Loader2,
  Plus,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import {
  createApiKeyAction,
  revokeApiKeyAction,
  type CreateKeyState,
} from "@/app/dashboard/api-keys/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiKeyView } from "@/lib/api-keys/types";

const initialState: CreateKeyState = { status: "idle", message: "" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ApiKeysManager({ initialKeys }: { initialKeys: ApiKeyView[] }) {
  const [state, formAction, pending] = useActionState(
    createApiKeyAction,
    initialState,
  );
  const [name, setName] = useState("");
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (state.status === "success" && state.secret) {
      setNewSecret(state.secret);
      setName("");
      toast.success("Clé créée — copiez-la maintenant, elle ne sera plus affichée.");
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  async function copySecret() {
    if (!newSecret) return;
    try {
      await navigator.clipboard.writeText(newSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copie impossible — sélectionnez la clé manuellement.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Révélation unique de la nouvelle clé */}
      {newSecret ? (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TriangleAlert className="size-4 text-primary" />
              Votre nouvelle clé API
            </CardTitle>
            <CardDescription>
              Copiez-la maintenant : pour des raisons de sécurité, elle ne sera{" "}
              <strong>plus jamais affichée</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded-md border bg-background px-3 py-2 font-mono text-sm">
                {newSecret}
              </code>
              <Button type="button" variant="outline" onClick={copySecret}>
                {copied ? <Check /> : <Copy />}
                {copied ? "Copié" : "Copier"}
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setNewSecret(null)}
            >
              J&apos;ai copié ma clé
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Création */}
      <Card>
        <CardHeader>
          <CardTitle>Créer une clé</CardTitle>
          <CardDescription>
            Donnez-lui un nom pour la reconnaître (ex. « Serveur prod », « Zapier »).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={formAction}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="name">Nom de la clé</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Serveur de production"
                maxLength={60}
                required
              />
            </div>
            <Button type="submit" disabled={pending || name.trim().length === 0}>
              {pending ? <Loader2 className="animate-spin" /> : <Plus />}
              Créer la clé
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Liste des clés */}
      <Card>
        <CardHeader>
          <CardTitle>Vos clés</CardTitle>
          <CardDescription>
            Seul un aperçu masqué est affiché. Révoquez une clé compromise à tout
            moment — l&apos;effet est immédiat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {initialKeys.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucune clé pour l&apos;instant. Créez-en une ci-dessus.
            </p>
          ) : (
            initialKeys.map((apiKey) => (
              <ApiKeyRow key={apiKey.id} apiKey={apiKey} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ApiKeyRow({ apiKey }: { apiKey: ApiKeyView }) {
  const [pending, startTransition] = useTransition();
  const revoked = apiKey.status === "revoked";

  function revoke() {
    if (
      !window.confirm(
        "Révoquer cette clé ? Les appels qui l'utilisent échoueront immédiatement.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const { ok } = await revokeApiKeyAction(apiKey.id);
      if (ok) toast.success("Clé révoquée.");
      else toast.error("Impossible de révoquer la clé.");
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <KeyRound className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{apiKey.name}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {apiKey.masked}
          </p>
          <p className="text-xs text-muted-foreground">
            Créée le {formatDate(apiKey.createdAt)}
            {apiKey.lastUsedAt
              ? ` · utilisée le ${formatDate(apiKey.lastUsedAt)}`
              : " · jamais utilisée"}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge
          variant="outline"
          className={
            revoked
              ? "border-transparent bg-destructive/10 text-destructive"
              : "border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          }
        >
          {revoked ? "Révoquée" : "Active"}
        </Badge>
        {!revoked ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={revoke}
            disabled={pending}
          >
            {pending ? <Loader2 className="animate-spin" /> : "Révoquer"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
