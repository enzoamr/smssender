"use server";

import { revalidatePath } from "next/cache";
import { launchCampaign } from "@/lib/campaigns/service";
import { getCurrentUser } from "@/lib/auth/session";
import { DEMO_ACCOUNT_ID } from "@/lib/config";

export interface CampaignActionState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function launchCampaignAction(
  _prev: CampaignActionState,
  formData: FormData,
): Promise<CampaignActionState> {
  const name = String(formData.get("name") ?? "");
  const from = String(formData.get("from") ?? "");
  const text = String(formData.get("text") ?? "");
  const target = String(formData.get("target") ?? "");
  // "__all__" (ou vide) = tous les abonnés ; sinon, le nom de la liste.
  const targetList = target === "__all__" || target === "" ? null : target;

  const accountId = (await getCurrentUser())?.accountId ?? DEMO_ACCOUNT_ID;
  const result = await launchCampaign(accountId, {
    name,
    from,
    text,
    targetList,
  });

  if (!result.ok) {
    return { status: "error", message: result.error ?? "Échec de la campagne." };
  }
  revalidatePath("/dashboard/campaigns");
  revalidatePath("/dashboard/messages");
  return {
    status: "success",
    message: `Campagne « ${name.trim()} » envoyée à ${result.campaign?.recipientCount} contact(s).`,
  };
}
