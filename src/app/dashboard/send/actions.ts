"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/errors";
import { DEMO_ACCOUNT_ID } from "@/lib/config";
import { sendMessage } from "@/lib/messaging/service";
import { normalizePhone } from "@/lib/phone";
import { scheduleMessage } from "@/lib/scheduler/service";

export interface SendActionState {
  status: "idle" | "success" | "error";
  message: string;
  count?: number;
}

/** Formate un instant ISO en date/heure lisible (fuseau du serveur ≈ Europe). */
function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Server Action déclenchée par le tableau de bord.
 *
 * Elle appelle EXACTEMENT le même service `sendMessage()` que l'API publique
 * `/api/v1/messages` — aucune logique d'envoi dupliquée ici.
 */
export async function sendSmsAction(
  _prev: SendActionState,
  formData: FormData,
): Promise<SendActionState> {
  const from = String(formData.get("from") ?? "").trim();
  const text = String(formData.get("text") ?? "");
  const scheduleAt = String(formData.get("scheduleAt") ?? "").trim();
  const recipients = String(formData.get("to") ?? "")
    .split(/[\n,;]+/)
    .map((value) => value.trim())
    .filter(Boolean);

  try {
    const accountId = (await getCurrentUser())?.accountId ?? DEMO_ACCOUNT_ID;

    // Envoi planifié : on valide en amont puis on délègue au scheduler générique.
    if (scheduleAt) {
      return await scheduleSend(accountId, { from, text, scheduleAt, recipients });
    }

    const messages = await sendMessage(
      { from, to: recipients, text },
      { accountId, source: "dashboard" },
    );
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/messages");

    // Refléter le résultat réel : un message rejeté par l'opérateur a le statut
    // FAILED, il ne faut donc pas le compter comme « envoyé ».
    const failedCount = messages.filter((m) => m.status === "FAILED").length;
    const sentCount = messages.length - failedCount;

    if (sentCount === 0) {
      return {
        status: "error",
        message:
          "Échec de l'envoi côté opérateur. Vérifiez votre configuration Twilio (identifiants, expéditeur, numéro destinataire).",
      };
    }
    if (failedCount > 0) {
      return {
        status: "success",
        message: `${sentCount} message(s) envoyé(s), ${failedCount} en échec.`,
        count: sentCount,
      };
    }
    return {
      status: "success",
      message: sentCount > 1 ? `${sentCount} messages envoyés.` : "Message envoyé.",
      count: sentCount,
    };
  } catch (error) {
    const message =
      error instanceof ApiError ? error.message : "Échec de l'envoi du message.";
    return { status: "error", message };
  }
}

/** Valide puis planifie un envoi à une date future via le scheduler générique. */
async function scheduleSend(
  accountId: string,
  input: { from: string; text: string; scheduleAt: string; recipients: string[] },
): Promise<SendActionState> {
  const runMs = Date.parse(input.scheduleAt);
  if (Number.isNaN(runMs)) {
    return { status: "error", message: "Date planifiée invalide." };
  }
  if (runMs <= Date.now()) {
    return { status: "error", message: "La date planifiée doit être dans le futur." };
  }
  if (!input.from) {
    return { status: "error", message: "Expéditeur requis." };
  }
  if (!input.text.trim()) {
    return { status: "error", message: "Message vide." };
  }
  if (input.recipients.length === 0) {
    return { status: "error", message: "Au moins un destinataire." };
  }

  // Normalisation E.164 immédiate : on rejette les numéros invalides tout de
  // suite plutôt qu'au moment de l'exécution.
  const normalized: string[] = [];
  for (const raw of input.recipients) {
    const phone = normalizePhone(raw);
    if (!phone) {
      return { status: "error", message: `Numéro invalide : « ${raw} ».` };
    }
    normalized.push(phone);
  }

  await scheduleMessage(
    accountId,
    new Date(runMs),
    { from: input.from, to: normalized, text: input.text },
    { type: "send", id: crypto.randomUUID() },
  );
  revalidatePath("/dashboard/scheduled");

  return {
    status: "success",
    message: `Envoi planifié pour le ${formatWhen(input.scheduleAt)} (${normalized.length} destinataire(s)).`,
    count: normalized.length,
  };
}
