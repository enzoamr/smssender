import { listAllMessages } from "@/lib/messaging/store";
import { TERMINAL_STATUSES } from "@/lib/messaging/types";
import { getStoredSettings } from "@/lib/settings/store";

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

export async function getPlatformStats(): Promise<PlatformStats> {
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
