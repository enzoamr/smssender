"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  saveSettingsAction,
  type SettingsActionState,
} from "@/app/dashboard/settings/actions";
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
import type { AccountSettingsView } from "@/lib/settings/types";

const initialState: SettingsActionState = { status: "idle", message: "" };

export function SettingsForm({ settings }: { settings: AccountSettingsView }) {
  const [state, formAction, pending] = useActionState(
    saveSettingsAction,
    initialState,
  );
  const [sender, setSender] = useState(settings.defaultSender);

  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
    else if (state.status === "error") toast.error(state.message);
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organisation</CardTitle>
        <CardDescription>
          Nom affiché et expéditeur par défaut de vos envois.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="organizationName">Nom de l&apos;organisation</Label>
            <Input
              id="organizationName"
              name="organizationName"
              defaultValue={settings.organizationName}
              placeholder="Mon entreprise"
              maxLength={60}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultSender">Expéditeur par défaut</Label>
            <Input
              id="defaultSender"
              name="defaultSender"
              value={sender}
              onChange={(e) => setSender(e.target.value.slice(0, 16))}
              maxLength={16}
              placeholder="Sendly"
            />
            <p className="text-xs text-muted-foreground">
              Sender ID alphanumérique (11 car. max) ou numéro Twilio, pré-rempli
              dans le formulaire d&apos;envoi.
            </p>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Enregistrer
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
