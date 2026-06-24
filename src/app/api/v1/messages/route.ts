import { after, NextResponse } from "next/server";
import { authenticateApiKey, type ApiPrincipal } from "@/lib/api/auth";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { logApiRequest } from "@/lib/logs/service";
import { isFutureSchedule, scheduleSend } from "@/lib/messaging/schedule";
import {
  listMessages,
  sendMessage,
  type SendMessageInput,
} from "@/lib/messaging/service";
import { toApiMessage } from "@/lib/messaging/types";

/**
 * API publique — Messages.
 *
 * IMPORTANT : ce handler est un adaptateur HTTP MINCE. Toute la logique métier
 * vit dans `sendMessage()` / `listMessages()`, exactement la même que celle
 * appelée par le tableau de bord. L'API ne fait que : authentifier -> limiter
 * -> parser -> déléguer au service -> formater la réponse (et journaliser).
 *
 * Contrat aligné sur TopMessage :
 *   POST /api/v1/messages   body { data: { from, to[], text } }  -> 201 { data: [...] }
 *   GET  /api/v1/messages                                        -> 200 { data: [...] }
 */

export const runtime = "nodejs";

const ENDPOINT = "/api/v1/messages";

interface SendBody {
  data?: SendMessageInput;
}

/** Applique le rate limiting au compte authentifié. */
function enforceRateLimit(principal: ApiPrincipal): void {
  const rl = checkRateLimit(`api:${principal.accountId}`);
  if (!rl.ok) {
    throw new ApiError(
      429,
      "rate_limited",
      `Trop de requêtes. Réessayez dans ${rl.retryAfter} s.`,
    );
  }
}

/** Journalise la requête après la réponse (non bloquant). */
function queueLog(
  principal: ApiPrincipal | null,
  method: string,
  status: number,
  start: number,
): void {
  if (!principal) return;
  after(async () => {
    await logApiRequest(principal.accountId, {
      method,
      target: ENDPOINT,
      status,
      durationMs: Date.now() - start,
      detail: principal.keyId,
    }).catch(() => {});
  });
}

export async function POST(request: Request) {
  const start = Date.now();
  let principal: ApiPrincipal | null = null;
  try {
    principal = await authenticateApiKey(request);
    enforceRateLimit(principal);

    let body: SendBody;
    try {
      body = (await request.json()) as SendBody;
    } catch {
      throw new ApiError(
        400,
        "invalid_request",
        "Corps de requête JSON invalide ou manquant.",
      );
    }
    const payload = body?.data ?? (body as SendMessageInput);

    // Envoi planifié : si `scheduleAt` est une date future, on crée un job via
    // le scheduler générique (202 Accepted) au lieu d'envoyer tout de suite.
    if (isFutureSchedule((payload as { scheduleAt?: unknown })?.scheduleAt)) {
      const scheduled = await scheduleSend(payload, {
        accountId: principal.accountId,
        source: "api",
      });
      queueLog(principal, "POST", 202, start);
      return NextResponse.json({ data: scheduled }, { status: 202 });
    }

    const messages = await sendMessage(payload, {
      accountId: principal.accountId,
      source: "api",
    });

    queueLog(principal, "POST", 201, start);
    return NextResponse.json({ data: messages.map(toApiMessage) }, { status: 201 });
  } catch (error) {
    const response = apiErrorResponse(error);
    queueLog(principal, "POST", response.status, start);
    return response;
  }
}

export async function GET(request: Request) {
  const start = Date.now();
  let principal: ApiPrincipal | null = null;
  try {
    principal = await authenticateApiKey(request);
    enforceRateLimit(principal);

    const messages = await listMessages(principal.accountId);

    queueLog(principal, "GET", 200, start);
    return NextResponse.json(
      { data: messages.map(toApiMessage) },
      { headers: { "X-Total-Count": String(messages.length) } },
    );
  } catch (error) {
    const response = apiErrorResponse(error);
    queueLog(principal, "GET", response.status, start);
    return response;
  }
}

/** Toute autre méthode (PUT, PATCH, DELETE…) est explicitement refusée. */
function methodNotAllowed() {
  return apiErrorResponse(
    new ApiError(
      405,
      "method_not_allowed",
      "Méthode non autorisée sur cet endpoint. Utilisez POST ou GET.",
    ),
  );
}

export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
export const OPTIONS = methodNotAllowed;
