import { randomUUID } from "crypto";
import { listSubscribedPhones } from "@/lib/contacts/service";
import { computeSegments } from "@/lib/messaging/segments";
import { sendMessage } from "@/lib/messaging/service";
import { normalizePhone } from "@/lib/phone";
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
  /**
   * Sélection explicite de numéros (contacts choisis un par un).
   * Si fournie et non vide, elle est prioritaire sur `targetList`.
   */
  recipientPhones?: string[];
}

export interface LaunchResult {
  ok: boolean;
  error?: string;
  campaign?: CampaignView;
}

/**
 * Résout la cible d'une campagne en numéros ABONNÉS (opt-out STOP exclus) et en
 * libellé lisible. Trois cas : sélection explicite, liste nommée, ou tous.
 */
async function resolveTarget(
  accountId: string,
  input: LaunchInput,
): Promise<{ phones: string[]; targetLabel: string }> {
  const explicit = (input.recipientPhones ?? [])
    .map((p) => normalizePhone(p))
    .filter((p): p is string => Boolean(p));

  if (explicit.length > 0) {
    // On restreint la sélection aux contacts réellement abonnés du compte.
    const subscribed = new Set(await listSubscribedPhones(accountId, null));
    const phones = Array.from(new Set(explicit)).filter((p) =>
      subscribed.has(p),
    );
    return { phones, targetLabel: `Sélection (${phones.length})` };
  }

  if (input.targetList) {
    const phones = await listSubscribedPhones(accountId, input.targetList);
    return { phones, targetLabel: `Liste : ${input.targetList}` };
  }

  const phones = await listSubscribedPhones(accountId, null);
  return { phones, targetLabel: "Tous les abonnés" };
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

  const { phones, targetLabel } = await resolveTarget(accountId, input);
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
    targetLabel,
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
      { accountId, source: "campaign", skipSuppression: true },
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
