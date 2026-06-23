"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import {
  sendSmsAction,
  type SendActionState,
} from "@/app/dashboard/send/actions";
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
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_SENDER } from "@/lib/config";
import { computeSegments } from "@/lib/messaging/segments";

const PRICE_PER_SEGMENT = 0.045;
const initialState: SendActionState = { status: "idle", message: "" };

export function SendSmsForm({
  defaultSender = DEFAULT_SENDER,
}: {
  defaultSender?: string;
}) {
  const [state, formAction, pending] = useActionState(
    sendSmsAction,
    initialState,
  );
  const [from, setFrom] = useState(defaultSender);
  const [to, setTo] = useState("");
  const [text, setText] = useState("");

  const seg = computeSegments(text);
  const recipients = to
    .split(/[\n,;]+/)
    .map((value) => value.trim())
    .filter(Boolean);
  const cost = recipients.length * seg.segmentCount * PRICE_PER_SEGMENT;

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      setTo("");
      setText("");
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={formAction} className="grid gap-4 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Composer</CardTitle>
            <CardDescription>
              Envoyez un SMS à un ou plusieurs destinataires.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="from">Expéditeur</Label>
              <Input
                id="from"
                name="from"
                value={from}
                onChange={(event) => setFrom(event.target.value.slice(0, 11))}
                maxLength={11}
                placeholder="Sendly"
              />
              <p className="text-xs text-muted-foreground">
                Nom alphanumérique (11 car. max) ou numéro virtuel.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to">Destinataires</Label>
              <Textarea
                id="to"
                name="to"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                placeholder={"+33612345678\n+33698765432"}
                className="min-h-20 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Un numéro par ligne, au format international.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="text">Message</Label>
              <Textarea
                id="text"
                name="text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Votre message…"
                className="min-h-32"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {seg.characters} caractères ·{" "}
                  {seg.encoding === "STANDARD" ? "GSM-7" : "Unicode"}
                </span>
                <span className="tabular-nums">
                  {seg.segmentCount} SMS · {seg.remaining} restants
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Aperçu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
                {from || DEFAULT_SENDER}
              </p>
              <div className="ml-auto max-w-[240px] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm break-words whitespace-pre-wrap text-primary-foreground shadow-sm">
                {text || "Votre message apparaîtra ici…"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Résumé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <SummaryRow label="Destinataires" value={String(recipients.length)} />
            <SummaryRow label="Segments / SMS" value={String(seg.segmentCount)} />
            <SummaryRow
              label="Total SMS"
              value={String(recipients.length * seg.segmentCount)}
            />
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-muted-foreground">Coût estimé</span>
              <span className="font-semibold tabular-nums">
                {cost.toFixed(2)} crédits
              </span>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={pending || recipients.length === 0 || text.length === 0}
            >
              {pending ? <Loader2 className="animate-spin" /> : <Send />}
              {pending ? "Envoi en cours…" : "Envoyer"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
