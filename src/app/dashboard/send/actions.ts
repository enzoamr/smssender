"use server";

import { revalidatePath } from "next/cache";
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
    const messages = await sendMessage(
      { from, to: recipients, text },
      { accountId: DEMO_ACCOUNT_ID, source: "dashboard" },
    );
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/messages");
    return {
      status: "success",
      message:
        messages.length > 1
          ? `${messages.length} messages envoyés.`
          : "Message envoyé.",
      count: messages.length,
    };
  } catch (error) {
    const message =
      error instanceof ApiError ? error.message : "Échec de l'envoi du message.";
    return { status: "error", message };
  }
}
