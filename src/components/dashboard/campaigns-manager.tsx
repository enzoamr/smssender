"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Check, Loader2, Search, Send } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { CampaignView } from "@/lib/campaigns/types";
import type { ContactView } from "@/lib/contacts/types";
import { ScheduleField } from "./schedule-field";

const initialState: CampaignActionState = { status: "idle", message: "" };

const TARGET_ALL = "__all__";
const TARGET_CONTACTS = "__contacts__";

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
  contacts,
}: {
  initialCampaigns: CampaignView[];
  lists: string[];
  contacts: ContactView[];
}) {
  const [state, formAction, pending] = useActionState(
    launchCampaignAction,
    initialState,
  );
  const [name, setName] = useState("");
  const [from, setFrom] = useState(DEFAULT_SENDER);
  const [text, setText] = useState("");
  const [target, setTarget] = useState(TARGET_ALL);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scheduleAt, setScheduleAt] = useState("");

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

  function targetTriggerLabel(): string {
    if (target === TARGET_ALL) return "Tous les abonnés";
    if (target === TARGET_CONTACTS)
      return `Contacts choisis${selected.size > 0 ? ` (${selected.size})` : ""}`;
    return `Liste : ${target}`;
  }

  const pickingContacts = target === TARGET_CONTACTS;
  const noTarget = pickingContacts && selected.size === 0;

  return (
    <div className="space-y-4">
      {/* Nouvelle campagne */}
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle campagne</CardTitle>
          <CardDescription>
            Le message part vers les contacts <strong>abonnés</strong> de la
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
                  onValueChange={(value) => setTarget(value ?? TARGET_ALL)}
                >
                  <SelectTrigger id="target" className="w-full">
                    {targetTriggerLabel()}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TARGET_ALL}>Tous les abonnés</SelectItem>
                    <SelectItem value={TARGET_CONTACTS}>
                      Contacts choisis un par un
                    </SelectItem>
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

            {pickingContacts && (
              <ContactPicker
                contacts={contacts}
                selected={selected}
                onChange={setSelected}
              />
            )}

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

            <div className="space-y-2">
              <Label>Programmation</Label>
              <ScheduleField onChange={setScheduleAt} />
            </div>

            <Button
              type="submit"
              disabled={
                pending ||
                name.trim().length === 0 ||
                text.trim().length === 0 ||
                noTarget
              }
            >
              {pending ? <Loader2 className="animate-spin" /> : <Send />}
              {pending
                ? "Envoi en cours…"
                : scheduleAt
                  ? "Planifier la campagne"
                  : "Envoyer la campagne"}
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
                      <span className="text-sm text-muted-foreground">
                        {c.targetLabel}
                      </span>
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

/** Sélecteur de contacts (recherche + cases à cocher) pour cibler un par un. */
function ContactPicker({
  contacts,
  selected,
  onChange,
}: {
  contacts: ContactView[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.phone.toLowerCase().includes(q) ||
        (c.name?.toLowerCase().includes(q) ?? false),
    );
  }, [contacts, query]);

  function toggle(phone: string) {
    const next = new Set(selected);
    if (next.has(phone)) next.delete(phone);
    else next.add(phone);
    onChange(next);
  }

  return (
    <div className="space-y-2 rounded-lg border p-3">
      {/* Numéros sélectionnés : envoyés au serveur via des inputs cachés. */}
      {Array.from(selected).map((phone) => (
        <input key={phone} type="hidden" name="recipients" value={phone} />
      ))}

      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm">
          Contacts ({selected.size} sélectionné{selected.size > 1 ? "s" : ""})
        </Label>
        {selected.size > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(new Set())}
          >
            Tout désélectionner
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un contact…"
          className="pl-8"
        />
      </div>

      {contacts.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Aucun contact abonné. Ajoutez-en dans l&apos;onglet Contacts.
        </p>
      ) : (
        <div className="max-h-56 space-y-1 overflow-y-auto">
          {filtered.map((c) => {
            const isSelected = selected.has(c.phone);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.phone)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  isSelected ? "bg-primary/10" : "hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded border",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40",
                  )}
                >
                  {isSelected && <Check className="size-3" />}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {c.name ?? <span className="text-muted-foreground">Sans nom</span>}
                </span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {c.phone}
                </span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Aucun résultat.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
