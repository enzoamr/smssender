"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  Check,
  CircleAlert,
  CircleCheck,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import {
  regenerateSecretAction,
  saveWebhookAction,
  testWebhookAction,
  type WebhookActionState,
} from "@/app/dashboard/webhooks/actions";
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
import type { WebhookEndpointView } from "@/lib/webhooks/types";

const initialState: WebhookActionState = { status: "idle", message: "" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WebhooksManager({
  endpoint,
}: {
  endpoint: WebhookEndpointView;
}) {
  const [state, formAction, pending] = useActionState(
    saveWebhookAction,
    initialState,
  );
  const [secret, setSecret] = useState(endpoint.secret);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, startTransition] = useTransition();

  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
    else if (state.status === "error") toast.error(state.message);
  }, [state]);

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copie impossible.");
    }
  }

  function regenerate() {
    if (
      !window.confirm(
        "Régénérer le secret ? L'ancien cessera de fonctionner immédiatement.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const { secret: next } = await regenerateSecretAction();
      setSecret(next);
      setRevealed(true);
      toast.success("Nouveau secret généré.");
    });
  }

  function test() {
    startTransition(async () => {
      const res = await testWebhookAction();
      if (res.ok) toast.success(`Test livré (HTTP ${res.status}).`);
      else if (res.error) toast.error(res.error);
      else
        toast.error(
          res.status
            ? `Échec : l'URL a répondu HTTP ${res.status}.`
            : "Échec : URL injoignable.",
        );
    });
  }

  return (
    <div className="space-y-4">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Endpoint</CardTitle>
          <CardDescription>
            L&apos;URL HTTPS qui recevra les changements de statut de vos messages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL de destination</Label>
              <Input
                id="url"
                name="url"
                type="url"
                defaultValue={endpoint.url ?? ""}
                placeholder="https://votre-domaine.com/webhooks/sendly"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={endpoint.enabled}
                className="size-4 rounded border-input accent-primary"
              />
              Activer l&apos;envoi des notifications
            </label>
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : null}
                Enregistrer
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={test}
                disabled={busy || !endpoint.url}
              >
                {busy ? <Loader2 className="animate-spin" /> : <Send />}
                Envoyer un test
              </Button>
            </div>
            {endpoint.lastDeliveryAt ? (
              <DeliveryStatus
                at={endpoint.lastDeliveryAt}
                status={endpoint.lastStatus}
              />
            ) : null}
          </form>
        </CardContent>
      </Card>

      {/* Secret de signature */}
      <Card>
        <CardHeader>
          <CardTitle>Secret de signature</CardTitle>
          <CardDescription>
            Recalculez le HMAC-SHA256 du corps reçu avec ce secret et comparez-le
            à l&apos;en-tête{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              X-Sendly-Signature
            </code>{" "}
            pour authentifier chaque requête.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-md border bg-muted/50 px-3 py-2 font-mono text-sm">
              {revealed ? secret : `${secret.slice(0, 9)}${"•".repeat(24)}`}
            </code>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setRevealed((v) => !v)}
              title={revealed ? "Masquer" : "Révéler"}
            >
              {revealed ? <EyeOff /> : <Eye />}
            </Button>
            <Button type="button" variant="outline" onClick={copySecret}>
              {copied ? <Check /> : <Copy />}
              {copied ? "Copié" : "Copier"}
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={regenerate}
            disabled={busy}
          >
            {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Régénérer le secret
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function DeliveryStatus({
  at,
  status,
}: {
  at: string;
  status: number | null;
}) {
  const ok = status !== null && status >= 200 && status < 300;
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <CircleCheck className="size-4 text-emerald-500" />
      ) : (
        <CircleAlert className="size-4 text-destructive" />
      )}
      <span className="text-muted-foreground">
        Dernière livraison le {formatDate(at)} ·{" "}
        {status ? `HTTP ${status}` : "URL injoignable"}
      </span>
    </div>
  );
}
