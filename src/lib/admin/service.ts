import { unstable_cache } from "next/cache";
import { listAllMessages } from "@/lib/messaging/store";
import {
  TERMINAL_STATUSES,
  type Message,
  type MessageStatus,
} from "@/lib/messaging/types";
import { getStoredSettings } from "@/lib/settings/store";

// Les stats globales scannent l'ensemble des messages : on met le résultat en
// cache 60 s pour ne pas tout recalculer à chaque chargement de page admin.
const CACHE_TTL = 60;

/**
 * Pilotage de la plateforme (super-admin).
 *
 * Accès réservé aux emails listés dans ADMIN_EMAILS. En mode démo (Firebase non
 * configuré), l'accès est ouvert pour pouvoir explorer la page.
 */

export function isAdmin(email: string | null, demo: boolean): boolean {
  if (demo) return true;
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

export interface AccountSummary {
  accountId: string;
  name: string;
  total: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
}

export interface PlatformStats {
  accountCount: number;
  totalMessages: number;
  totalSegments: number;
  deliveryRate: number;
  accounts: AccountSummary[];
}

async function computePlatformStats(): Promise<PlatformStats> {
  const messages = await listAllMessages();

  const agg = new Map<
    string,
    { total: number; delivered: number; failed: number; finalized: number }
  >();
  let totalSegments = 0;
  let globalDelivered = 0;
  let globalFinalized = 0;

  for (const m of messages) {
    totalSegments += m.segmentCount;
    const a =
      agg.get(m.accountId) ??
      { total: 0, delivered: 0, failed: 0, finalized: 0 };
    a.total += 1;
    const isDelivered = m.status === "DELIVERED";
    const isFailed = m.status === "FAILED" || m.status === "UNDELIVERED";
    if (isDelivered) a.delivered += 1;
    if (isFailed) a.failed += 1;
    if (TERMINAL_STATUSES.includes(m.status)) {
      a.finalized += 1;
      globalFinalized += 1;
      if (isDelivered) globalDelivered += 1;
    }
    agg.set(m.accountId, a);
  }

  // Tri par volume, puis enrichissement avec le nom d'organisation.
  const ranked = Array.from(agg.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 50);

  const accounts: AccountSummary[] = await Promise.all(
    ranked.map(async ([accountId, a]) => {
      const settings = await getStoredSettings(accountId);
      return {
        accountId,
        name: settings?.organizationName || accountId,
        total: a.total,
        delivered: a.delivered,
        failed: a.failed,
        deliveryRate:
          a.finalized === 0
            ? 0
            : Math.round((a.delivered / a.finalized) * 100),
      };
    }),
  );

  return {
    accountCount: agg.size,
    totalMessages: messages.length,
    totalSegments,
    deliveryRate:
      globalFinalized === 0
        ? 0
        : Math.round((globalDelivered / globalFinalized) * 100),
    accounts,
  };
}

// --- Flux global des messages (/admin/messages, /admin/moderation) ---------

export interface AdminMessageRow {
  id: string;
  account: string;
  to: string;
  from: string;
  status: MessageStatus;
  errorCode: string | null;
  segmentCount: number;
  createdAt: string;
}

/** Masque les 4 derniers chiffres du destinataire (confidentialité). */
function maskPhone(phone: string): string {
  return phone.length <= 4 ? phone : `${phone.slice(0, -4)}••••`;
}

function toRow(m: Message): AdminMessageRow {
  return {
    id: m.id,
    account: m.accountId,
    to: maskPhone(m.to),
    from: m.from,
    status: m.status,
    errorCode: m.errorCode,
    segmentCount: m.segmentCount,
    createdAt: m.createdAt,
  };
}

async function computeRecentPlatformMessages(
  limit = 100,
): Promise<AdminMessageRow[]> {
  const messages = await listAllMessages();
  return messages
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map(toRow);
}

// --- Modération ------------------------------------------------------------

export interface ModerationData {
  /** Comptes au taux de délivrabilité anormalement bas (signal de spam). */
  riskyAccounts: AccountSummary[];
  /** Messages récemment en échec, pour inspection. */
  recentFailures: AdminMessageRow[];
}

async function computeModerationData(): Promise<ModerationData> {
  const messages = await listAllMessages();

  const agg = new Map<
    string,
    { total: number; delivered: number; failed: number; finalized: number }
  >();
  for (const m of messages) {
    const a =
      agg.get(m.accountId) ??
      { total: 0, delivered: 0, failed: 0, finalized: 0 };
    a.total += 1;
    if (m.status === "DELIVERED") a.delivered += 1;
    if (m.status === "FAILED" || m.status === "UNDELIVERED") a.failed += 1;
    if (TERMINAL_STATUSES.includes(m.status)) a.finalized += 1;
    agg.set(m.accountId, a);
  }

  const riskyAccounts: AccountSummary[] = await Promise.all(
    Array.from(agg.entries())
      .filter(([, a]) => a.finalized >= 5 && a.delivered / a.finalized < 0.8)
      .sort(
        (a, b) =>
          a[1].delivered / a[1].finalized - b[1].delivered / b[1].finalized,
      )
      .slice(0, 20)
      .map(async ([accountId, a]) => {
        const settings = await getStoredSettings(accountId);
        return {
          accountId,
          name: settings?.organizationName || accountId,
          total: a.total,
          delivered: a.delivered,
          failed: a.failed,
          deliveryRate: Math.round((a.delivered / a.finalized) * 100),
        };
      }),
  );

  const recentFailures = messages
    .filter((m) => m.status === "FAILED" || m.status === "UNDELIVERED")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50)
    .map(toRow);

  return { riskyAccounts, recentFailures };
}

// --- Exports mis en cache (revalidation toutes les 60 s) --------------------

export const getPlatformStats = unstable_cache(
  computePlatformStats,
  ["admin:platform-stats"],
  { revalidate: CACHE_TTL },
);

export const listRecentPlatformMessages = unstable_cache(
  computeRecentPlatformMessages,
  ["admin:recent-messages"],
  { revalidate: CACHE_TTL },
);

export const getModerationData = unstable_cache(
  computeModerationData,
  ["admin:moderation"],
  { revalidate: CACHE_TTL },
);
