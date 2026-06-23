import { z } from "zod";
import { ApiError } from "@/lib/api/errors";
import { computeSegments } from "./segments";
import { getProvider } from "./provider";
import {
  createMessage,
  listMessages as storeListMessages,
  updateMessage,
} from "./store";
import { TERMINAL_STATUSES, type Message } from "./types";

/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  SERVICE D'ENVOI — la "surcouche" au-dessus de Twilio.                     │
 * │                                                                           │
 * │  C'est le SEUL chemin pour envoyer un SMS. Deux points d'entrée l'appellent│
 * │  en interne (pas d'appel HTTP entre eux) :                                 │
 * │    1. Le tableau de bord (Server Action, session utilisateur)             │
 * │    2. L'API publique /api/v1 (clé API client)                             │
 * │                                                                           │
 * │  → validation, segments, crédits, persistance, provider, statut, webhooks │
 * │    sont gérés une seule fois, ici. Aucune dérive possible entre les deux.  │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

const PRICE_PER_SEGMENT = 0.045; // crédits par segment (à brancher sur la grille tarifaire réelle)

export const sendMessageSchema = z.object({
  from: z.string().trim().min(1, "Expéditeur requis").max(11, "11 caractères max"),
  to: z
    .union([z.string(), z.array(z.string())])
    .transform((value) => (Array.isArray(value) ? value : [value]))
    .pipe(
      z
        .array(z.string().trim().min(1))
        .min(1, "Au moins un destinataire")
        .max(1000, "1000 destinataires max par requête"),
    ),
  text: z.string().trim().min(1, "Message vide").max(1530, "Message trop long"),
  scheduleAt: z.string().datetime().optional().nullable(),
});

export type SendMessageInput = z.input<typeof sendMessageSchema>;

export interface SendContext {
  accountId: string;
  source: "dashboard" | "api" | "campaign";
}

/**
 * Envoie un SMS à un ou plusieurs destinataires.
 * Un envoi vers N numéros crée N messages (fan-out), chacun suivi indépendamment.
 */
export async function sendMessage(
  input: SendMessageInput,
  ctx: SendContext,
): Promise<Message[]> {
  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new ApiError(400, "invalid_request", first?.message ?? "Requête invalide");
  }

  const { from, to, text, scheduleAt } = parsed.data;

  // TODO(billing): vérifier le solde de crédits du compte avant l'envoi
  //   et débiter atomiquement (transaction Firestore / Stripe usage record).
  //   En cas de solde insuffisant -> throw new ApiError(402, "insufficient_balance", ...).

  const provider = getProvider();
  const seg = computeSegments(text);
  const now = new Date().toISOString();

  const results = await Promise.all(
    to.map(async (recipient) => {
      const message: Message = {
        id: `msg_${crypto.randomUUID()}`,
        accountId: ctx.accountId,
        status: "QUEUED",
        from,
        to: recipient,
        text,
        channel: "SMS",
        segmentCount: seg.segmentCount,
        encoding: seg.encoding,
        direction: "OUTBOUND",
        country: detectCountry(recipient),
        type: "text",
        providerId: null,
        price: seg.segmentCount * PRICE_PER_SEGMENT,
        errorCode: null,
        source: ctx.source,
        scheduleAt: scheduleAt ?? null,
        createdAt: now,
        updatedAt: now,
      };

      await createMessage(message);

      // Envoi via le provider (Twilio en prod, stub sans clés).
      try {
        const sent = await provider.send({ from, to: recipient, text });
        message.providerId = sent.providerId;
        message.status = sent.status;
        message.updatedAt = new Date().toISOString();
        await updateMessage(message.id, {
          providerId: sent.providerId,
          status: sent.status,
        });
      } catch (error) {
        message.status = "FAILED";
        message.errorCode = "provider_error";
        await updateMessage(message.id, {
          status: "FAILED",
          errorCode: "provider_error",
        });
        console.error("[messaging] provider send failed", error);
      }

      return message;
    }),
  );

  return results;
}

export async function listMessages(
  accountId: string,
  limit = 100,
): Promise<Message[]> {
  return storeListMessages(accountId, limit);
}

export interface DashboardStats {
  totalSent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
  totalSegments: number;
  /** Série quotidienne sur 14 jours pour le graphe. */
  daily: Array<{ date: string; label: string; sent: number; delivered: number }>;
}

/** Agrège des statistiques pour la vue d'ensemble du tableau de bord. */
export async function getDashboardStats(accountId: string): Promise<DashboardStats> {
  const messages = await listMessages(accountId, 1000);

  const delivered = messages.filter((m) => m.status === "DELIVERED").length;
  const failed = messages.filter(
    (m) => m.status === "FAILED" || m.status === "UNDELIVERED",
  ).length;
  const totalSegments = messages.reduce((sum, m) => sum + m.segmentCount, 0);
  const finalized = messages.filter((m) =>
    TERMINAL_STATUSES.includes(m.status),
  ).length;

  const days = 14;
  const daily: DashboardStats["daily"] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);

    const inDay = messages.filter((m) => {
      const created = new Date(m.createdAt);
      return created >= day && created < next;
    });

    daily.push({
      date: day.toISOString(),
      label: day.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
      sent: inDay.length,
      delivered: inDay.filter((m) => m.status === "DELIVERED").length,
    });
  }

  return {
    totalSent: messages.length,
    delivered,
    failed,
    deliveryRate: finalized === 0 ? 0 : Math.round((delivered / finalized) * 100),
    totalSegments,
    daily,
  };
}

/** Détection naïve du pays à partir du préfixe international. */
function detectCountry(phone: string): string | null {
  const prefixes: Record<string, string> = {
    "+33": "FR",
    "+32": "BE",
    "+41": "CH",
    "+44": "GB",
    "+1": "US",
    "+49": "DE",
    "+34": "ES",
    "+39": "IT",
  };
  const normalized = phone.replace(/\s/g, "");
  for (const [prefix, country] of Object.entries(prefixes)) {
    if (normalized.startsWith(prefix)) return country;
  }
  return null;
}
