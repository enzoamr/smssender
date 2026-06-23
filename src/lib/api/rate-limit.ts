/**
 * Rate limiting simple à fenêtre glissante, en mémoire.
 *
 * Limite par instance serverless (pas de coordination globale) : suffisant pour
 * absorber les pics et bloquer les abus évidents. Pour une limite stricte et
 * distribuée, brancher un store partagé (Redis/Upstash).
 */

const buckets = new Map<string, number[]>();

const DEFAULT_LIMIT = 120; // requêtes
const DEFAULT_WINDOW_MS = 60_000; // par minute

export interface RateLimitResult {
  ok: boolean;
  /** Secondes avant de pouvoir réessayer (si bloqué). */
  retryAfter: number;
}

export function checkRateLimit(
  key: string,
  limit = DEFAULT_LIMIT,
  windowMs = DEFAULT_WINDOW_MS,
): RateLimitResult {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    buckets.set(key, hits);
    const retryAfter = Math.max(1, Math.ceil((windowMs - (now - hits[0])) / 1000));
    return { ok: false, retryAfter };
  }

  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfter: 0 };
}
