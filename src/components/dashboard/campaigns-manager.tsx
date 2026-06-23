"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import {
  launchCampaignAction,
  type CampaignActionState,
} from "@/app/dashboard/campaigns/actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_SENDER } from "@/lib/config";
import { computeSegments } from "@/lib/messaging/segments";
import type { CampaignView } from "@/lib/campaigns/types";

const initialState: CampaignActionState = { status: "idle", message: "" };

const ALL_TARGET = "__all__";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: CampaignView["status"] }) {
  const map = {
    sending: { label: "En cours", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    sent: { label: "Envoyée", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    failed: { label: "Échec", className: "bg-destructive/10 text-destructive" },
  }[status];
  return (
    <Badge variant="outline" className={`border-transparent ${map.className}`}>
      {map.label}
    </Badge>
  );
}

export function CampaignsManager({
  initialCampaigns,
  lists,
}: {
  initialCampaigns: CampaignView[];
  lists: string[];
}) {
  const [state, formAction, pending] = useActionState(
    launchCampaignAction,
    initialState,
  );
  const [name, setName] = useState("");
  const [from, setFrom] = useState(DEFAULT_SENDER);
  const [text, setText] = useState("");
  const [target, setTarget] = useState(ALL_TARGET);

  const seg = computeSegments(text);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      setName("");
      setText("");
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <div className="space-y-4">
      {/* Nouvelle campagne */}
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle campagne</CardTitle>
          <CardDescription>
            Le message part vers tous les contacts <strong>abonnés</strong> de la
            cible (les désinscrits STOP sont automatiquement exclus).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="name">Nom de la campagne</Label>
                <Input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Soldes d'été"
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="target">Cible</Label>
                <input type="hidden" name="target" value={target} />
                <Select
                  value={target}
                  onValueChange={(value) => setTarget(value ?? ALL_TARGET)}
                >
                  <SelectTrigger id="target" className="w-full">
                    {target === ALL_TARGET ? "Tous les abonnés" : `Liste : ${target}`}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_TARGET}>Tous les abonnés</SelectItem>
                    {lists.map((l) => (
                      <SelectItem key={l} value={l}>
                        Liste : {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="from">Expéditeur</Label>
                <Input
                  id="from"
                  name="from"
                  value={from}
                  onChange={(e) => setFrom(e.target.value.slice(0, 16))}
                  maxLength={16}
                  placeholder="Sendly"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="text">Message</Label>
              <Textarea
                id="text"
                name="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Votre message…"
                className="min-h-28"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {seg.characters} caractères ·{" "}
                  {seg.encoding === "STANDARD" ? "GSM-7" : "Unicode"}
                </span>
                <span className="tabular-nums">{seg.segmentCount} SMS / contact</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={pending || name.trim().length === 0 || text.trim().length === 0}
            >
              {pending ? <Loader2 className="animate-spin" /> : <Send />}
              {pending ? "Envoi en cours…" : "Envoyer la campagne"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Historique */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des campagnes</CardTitle>
          <CardDescription>
            Suivi des envois groupés et de leur résultat.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {initialCampaigns.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucune campagne pour l&apos;instant.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campagne</TableHead>
                  <TableHead>Cible</TableHead>
                  <TableHead className="text-right">Destinataires</TableHead>
                  <TableHead className="text-right">Résultat</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialCampaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      {c.targetList ? (
                        <Badge variant="secondary">{c.targetList}</Badge>
                      ) : (
                        <span className="text-muted-foreground">Tous</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.recipientCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {c.sentCount} envoyés
                      </span>
                      {c.failedCount > 0 ? (
                        <span className="text-destructive">
                          {" "}· {c.failedCount} échecs
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                      {formatDate(c.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
