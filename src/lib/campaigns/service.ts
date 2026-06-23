import { randomUUID } from "crypto";
import { listSubscribedPhones } from "@/lib/contacts/service";
import { computeSegments } from "@/lib/messaging/segments";
import { sendMessage } from "@/lib/messaging/service";
import { createCampaign, listCampaigns, updateCampaign } from "./store";
import { toCampaignView, type Campaign, type CampaignView } from "./types";

/**
 * Logique métier des campagnes.
 *
 * Une campagne s'appuie sur le MÊME service `sendMessage()` que l'envoi unitaire
 * et l'API. Elle ne fait qu'ajouter : la résolution de la cible (contacts
 * abonnés d'une liste, opt-out STOP exclus) et le suivi agrégé.
 */

// Limité pour rester sous le timeout des fonctions serverless ; au-delà, une
// file d'attente sera nécessaire (envoi asynchrone par lots).
const MAX_RECIPIENTS = 500;

export interface LaunchInput {
  name: string;
  from: string;
  text: string;
  /** Liste ciblée, ou `null` pour tous les abonnés. */
  targetList: string | null;
}

export interface LaunchResult {
  ok: boolean;
  error?: string;
  campaign?: CampaignView;
}

export async function launchCampaign(
  accountId: string,
  input: LaunchInput,
): Promise<LaunchResult> {
  const name = input.name.trim();
  const from = input.from.trim();
  const text = input.text.trim();

  if (!name) return { ok: false, error: "Nom de campagne requis." };
  if (!from) return { ok: false, error: "Expéditeur requis." };
  if (!text) return { ok: false, error: "Message vide." };

  const phones = await listSubscribedPhones(accountId, input.targetList);
  if (phones.length === 0) {
    return {
      ok: false,
      error: "Aucun contact abonné dans cette cible (vérifiez vos contacts).",
    };
  }
  if (phones.length > MAX_RECIPIENTS) {
    return {
      ok: false,
      error: `Trop de destinataires (${phones.length}). Maximum ${MAX_RECIPIENTS} par campagne pour l'instant.`,
    };
  }

  const seg = computeSegments(text);
  const now = new Date().toISOString();
  const campaign: Campaign = {
    id: `camp_${randomUUID()}`,
    accountId,
    name,
    from,
    text,
    targetList: input.targetList,
    status: "sending",
    recipientCount: phones.length,
    sentCount: 0,
    failedCount: 0,
    segmentCount: seg.segmentCount,
    createdAt: now,
    completedAt: null,
  };
  await createCampaign(campaign);

  // Envoi groupé via le service partagé (fan-out interne).
  let sentCount = 0;
  let failedCount = 0;
  try {
    const messages = await sendMessage(
      { from, to: phones, text },
      { accountId, source: "campaign" },
    );
    failedCount = messages.filter((m) => m.status === "FAILED").length;
    sentCount = messages.length - failedCount;
  } catch {
    failedCount = phones.length;
  }

  const completedAt = new Date().toISOString();
  const status: Campaign["status"] = sentCount > 0 ? "sent" : "failed";
  await updateCampaign(campaign.id, {
    status,
    sentCount,
    failedCount,
    completedAt,
  });

  return {
    ok: true,
    campaign: toCampaignView({
      ...campaign,
      status,
      sentCount,
      failedCount,
      completedAt,
    }),
  };
}

export async function listCampaignsForAccount(
  accountId: string,
): Promise<CampaignView[]> {
  const campaigns = await listCampaigns(accountId);
  return campaigns.map(toCampaignView);
}
