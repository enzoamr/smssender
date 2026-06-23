"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { DEMO_ACCOUNT_ID } from "@/lib/config";
import { saveSettings } from "@/lib/settings/service";

export interface SettingsActionState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function saveSettingsAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const organizationName = String(formData.get("organizationName") ?? "");
  const defaultSender = String(formData.get("defaultSender") ?? "");

  const accountId = (await getCurrentUser())?.accountId ?? DEMO_ACCOUNT_ID;
  const result = await saveSettings(accountId, {
    organizationName,
    defaultSender,
  });
  if (!result.ok) {
    return { status: "error", message: result.error ?? "Échec de l'enregistrement." };
  }
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/send");
  return { status: "success", message: "Réglages enregistrés." };
}
