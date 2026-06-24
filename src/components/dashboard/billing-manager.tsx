"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CreditCard,
  ExternalLink,
  Loader2,
  Package,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  openPortalAction,
  startCheckoutAction,
} from "@/app/dashboard/billing/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BillingView, LedgerEntry } from "@/lib/billing/types";

interface OfferCard {
  id: string;
  name: string;
  credits: number;
  price: string;
  description: string;
  available: boolean;
}

const REASON_LABELS: Record<LedgerEntry["reason"], string> = {
  purchase: "Achat de crédits",
  subscription: "Abonnement",
  send: "Envoi de SMS",
  welcome: "Crédits de bienvenue",
  adjustment: "Ajustement",
};

function fmt(n: number): string {
  return n.toLocaleString("fr-FR");
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BillingManager({
  view,
  ledger,
  plans,
  packs,
  enabled,
  initialStatus,
}: {
  view: BillingView;
  ledger: LedgerEntry[];
  plans: OfferCard[];
  packs: OfferCard[];
  enabled: boolean;
  initialStatus: string | null;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Retour de Stripe : confirmer puis rafraîchir (le webhook crédite en arrière-plan).
  useEffect(() => {
    if (initialStatus === "success") {
      toast.success("Paiement confirmé ! Votre solde se met à jour…");
      const t = setTimeout(() => router.refresh(), 2500);
      return () => clearTimeout(t);
    }
    if (initialStatus === "cancel") toast.info("Paiement annulé.");
  }, [initialStatus, router]);

  function checkout(offerId: string) {
    setPendingId(offerId);
    startTransition(async () => {
      const res = await startCheckoutAction(offerId);
      if (res.ok && res.url) {
        window.location.href = res.url;
      } else {
        toast.error(res.error ?? "Paiement indisponible.");
        setPendingId(null);
      }
    });
  }

  function portal() {
    setPendingId("__portal__");
    startTransition(async () => {
      const res = await openPortalAction();
      if (res.ok && res.url) window.location.href = res.url;
      else {
        toast.error(res.error ?? "Portail indisponible.");
        setPendingId(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      {!enabled && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          Stripe n&apos;est pas encore configuré : les paiements sont
          indisponibles et les envois ne sont pas débités. Renseignez les clés
          Stripe pour activer la facturation.
        </div>
      )}

      {/* Solde + abonnement */}
      <Card>
        <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Solde de crédits</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">
              {fmt(view.credits)}
              <span className="ml-2 text-base font-normal text-muted-foreground">
                crédits
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              1 crédit = 1 segment SMS.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            {view.planName ? (
              <>
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="size-3" />
                  Abonnement {view.planName}
                  {view.subscriptionStatus &&
                    view.subscriptionStatus !== "active" &&
                    ` · ${view.subscriptionStatus}`}
                </Badge>
                {view.currentPeriodEnd && (
                  <p className="text-xs text-muted-foreground">
                    Renouvellement le {fmtDate(view.currentPeriodEnd)}
                  </p>
                )}
              </>
            ) : (
              <Badge variant="outline">Aucun abonnement</Badge>
            )}
            {view.hasSubscription && (
              <Button
                variant="outline"
                size="sm"
                onClick={portal}
                disabled={!enabled || pendingId === "__portal__"}
              >
                {pendingId === "__portal__" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <ExternalLink />
                )}
                Gérer l&apos;abonnement
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Abonnements */}
      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold">Abonnements mensuels</h3>
          <p className="text-sm text-muted-foreground">
            Un quota de crédits renouvelé chaque mois. Annulable à tout moment.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <OfferTile
              key={plan.id}
              offer={plan}
              current={view.plan === plan.id}
              enabled={enabled}
              pending={pendingId === plan.id}
              cta="S'abonner"
              icon={<Sparkles className="size-4" />}
              onClick={() => checkout(plan.id)}
            />
          ))}
        </div>
      </section>

      {/* Packs */}
      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold">Recharges ponctuelles</h3>
          <p className="text-sm text-muted-foreground">
            Achetez des crédits à l&apos;unité, sans engagement.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {packs.map((pack) => (
            <OfferTile
              key={pack.id}
              offer={pack}
              enabled={enabled}
              pending={pendingId === pack.id}
              cta="Acheter"
              icon={<Package className="size-4" />}
              onClick={() => checkout(pack.id)}
            />
          ))}
        </div>
      </section>

      {/* Historique des mouvements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mouvements récents</CardTitle>
          <CardDescription>
            Achats, renouvellements et consommation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {ledger.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucun mouvement pour l&apos;instant.
            </p>
          ) : (
            ledger.map((e) => {
              const positive = e.amount >= 0;
              return (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-3 border-b py-2 text-sm last:border-0"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-md",
                        positive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {positive ? (
                        <ArrowUpRight className="size-4" />
                      ) : (
                        <ArrowDownRight className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate">{REASON_LABELS[e.reason]}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmtDate(e.createdAt)}
                        {e.detail ? ` · ${e.detail}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right tabular-nums">
                    <span
                      className={cn(
                        "font-medium",
                        positive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-foreground",
                      )}
                    >
                      {positive ? "+" : ""}
                      {fmt(e.amount)}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      solde {fmt(e.balanceAfter)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OfferTile({
  offer,
  current,
  enabled,
  pending,
  cta,
  icon,
  onClick,
}: {
  offer: OfferCard;
  current?: boolean;
  enabled: boolean;
  pending: boolean;
  cta: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  const disabled = !enabled || !offer.available || pending || current;
  return (
    <Card className={cn(current && "border-primary ring-1 ring-primary")}>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1.5 text-base">
            {icon}
            {offer.name}
          </CardTitle>
          {current && <Badge variant="secondary">Plan actuel</Badge>}
        </div>
        <p className="text-2xl font-semibold tracking-tight">{offer.price}</p>
        <CardDescription>{offer.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-3 flex items-center gap-1.5 text-sm font-medium">
          <Check className="size-4 text-primary" />
          {fmt(offer.credits)} crédits
        </p>
        <Button className="w-full" onClick={onClick} disabled={disabled}>
          {pending ? <Loader2 className="animate-spin" /> : <CreditCard />}
          {current ? "Plan actuel" : !offer.available ? "Bientôt" : cta}
        </Button>
      </CardContent>
    </Card>
  );
}
