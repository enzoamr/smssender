"use server";

import { revalidatePath } from "next/cache";
import {
  regenerateSecret,
  saveWebhookConfig,
  sendTestEvent,
} from "@/lib/webhooks/service";
import { getCurrentUser } from "@/lib/auth/session";
import { DEMO_ACCOUNT_ID } from "@/lib/config";

async function currentAccountId(): Promise<string> {
  return (await getCurrentUser())?.accountId ?? DEMO_ACCOUNT_ID;
}

export interface WebhookActionState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function saveWebhookAction(
  _prev: WebhookActionState,
  formData: FormData,
): Promise<WebhookActionState> {
  const url = String(formData.get("url") ?? "");
  const enabled = formData.get("enabled") === "on";

  const accountId = await currentAccountId();
  const result = await saveWebhookConfig(accountId, url, enabled);
  if (!result.ok) {
    return { status: "error", message: result.error ?? "Échec de l'enregistrement." };
  }
  revalidatePath("/dashboard/webhooks");
  return { status: "success", message: "Configuration enregistrée." };
}

export async function regenerateSecretAction(): Promise<{ secret: string }> {
  const accountId = await currentAccountId();
  const secret = await regenerateSecret(accountId);
  revalidatePath("/dashboard/webhooks");
  return { secret };
}

export async function testWebhookAction(): Promise<{
  ok: boolean;
  status: number | null;
  error?: string;
}> {
  const accountId = await currentAccountId();
  const result = await sendTestEvent(accountId);
  revalidatePath("/dashboard/webhooks");
  return result;
}
