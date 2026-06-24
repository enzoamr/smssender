"use server";

import { revalidatePath } from "next/cache";
import { launchCampaign } from "@/lib/campaigns/service";
import { getCurrentUser } from "@/lib/auth/session";
import { DEMO_ACCOUNT_ID } from "@/lib/config";
import { scheduleCampaign } from "@/lib/scheduler/service";

export interface CampaignActionState {
  status: "idle" | "success" | "error";
  message: string;
}

// Valeurs spéciales du sélecteur de cible.
const TARGET_ALL = "__all__";
const TARGET_CONTACTS = "__contacts__";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function launchCampaignAction(
  _prev: CampaignActionState,
  formData: FormData,
): Promise<CampaignActionState> {
  const name = String(formData.get("name") ?? "");
  const from = String(formData.get("from") ?? "");
  const text = String(formData.get("text") ?? "");
  const target = String(formData.get("target") ?? "");
  const scheduleAt = String(formData.get("scheduleAt") ?? "").trim();
  const recipientPhones = formData
    .getAll("recipients")
    .map((v) => String(v).trim())
    .filter(Boolean);

  // Résolution de la cible : tous les abonnés, une sélection, ou une liste.
  let targetList: string | null = null;
  let selection: string[] | undefined;
  let targetLabel: string;
  if (target === TARGET_CONTACTS) {
    if (recipientPhones.length === 0) {
      return { status: "error", message: "Aucun contact sélectionné." };
    }
    selection = recipientPhones;
    targetLabel = `Sélection (${recipientPhones.length})`;
  } else if (target === TARGET_ALL || target === "") {
    targetLabel = "Tous les abonnés";
  } else {
    targetList = target;
    targetLabel = `Liste : ${target}`;
  }

  const accountId = (await getCurrentUser())?.accountId ?? DEMO_ACCOUNT_ID;

  // Campagne planifiée : on délègue au scheduler générique (un seul job).
  if (scheduleAt) {
    const runMs = Date.parse(scheduleAt);
    if (Number.isNaN(runMs)) {
      return { status: "error", message: "Date planifiée invalide." };
    }
    if (runMs <= Date.now()) {
      return { status: "error", message: "La date planifiée doit être dans le futur." };
    }
    if (!name.trim()) return { status: "error", message: "Nom de campagne requis." };
    if (!text.trim()) return { status: "error", message: "Message vide." };

    await scheduleCampaign(accountId, new Date(runMs), {
      name: name.trim(),
      from,
      text,
      targetList,
      recipientPhones: selection,
      targetLabel,
    });
    revalidatePath("/dashboard/scheduled");
    return {
      status: "success",
      message: `Campagne « ${name.trim()} » planifiée pour le ${formatWhen(scheduleAt)}.`,
    };
  }

  // Envoi immédiat.
  const result = await launchCampaign(accountId, {
    name,
    from,
    text,
    targetList,
    recipientPhones: selection,
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
