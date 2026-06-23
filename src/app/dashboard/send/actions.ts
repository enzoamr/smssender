"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/errors";
import { DEMO_ACCOUNT_ID } from "@/lib/config";
import { sendMessage } from "@/lib/messaging/service";

export interface SendActionState {
  status: "idle" | "success" | "error";
  message: string;
  count?: number;
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
  const recipients = String(formData.get("to") ?? "")
    .split(/[\n,;]+/)
    .map((value) => value.trim())
    .filter(Boolean);

  try {
    const accountId = (await getCurrentUser())?.accountId ?? DEMO_ACCOUNT_ID;
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
