import { NextResponse } from "next/server";
import { authenticateApiKey, type ApiPrincipal } from "@/lib/api/auth";
import { apiErrorResponse } from "@/lib/api/errors";
import { logApiRequest } from "@/lib/logs/service";
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
 * appelée par le tableau de bord. L'API ne fait que : authentifier -> parser
 * -> déléguer au service -> formater la réponse (et journaliser).
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

/** Journalise la requête sous le compte authentifié (best-effort). */
async function log(
  principal: ApiPrincipal | null,
  method: string,
  status: number,
  start: number,
): Promise<void> {
  if (!principal) return;
  await logApiRequest(principal.accountId, {
    method,
    target: ENDPOINT,
    status,
    durationMs: Date.now() - start,
    detail: principal.keyId,
  }).catch(() => {});
}

export async function POST(request: Request) {
  const start = Date.now();
  let principal: ApiPrincipal | null = null;
  try {
    principal = await authenticateApiKey(request);
    const body = (await request.json().catch(() => ({}))) as SendBody;
    const payload = body.data ?? (body as SendMessageInput);

    const messages = await sendMessage(payload, {
      accountId: principal.accountId,
      source: "api",
    });

    await log(principal, "POST", 201, start);
    return NextResponse.json({ data: messages.map(toApiMessage) }, { status: 201 });
  } catch (error) {
    const response = apiErrorResponse(error);
    await log(principal, "POST", response.status, start);
    return response;
  }
}

export async function GET(request: Request) {
  const start = Date.now();
  let principal: ApiPrincipal | null = null;
  try {
    principal = await authenticateApiKey(request);
    const messages = await listMessages(principal.accountId);

    await log(principal, "GET", 200, start);
    return NextResponse.json(
      { data: messages.map(toApiMessage) },
      { headers: { "X-Total-Count": String(messages.length) } },
    );
  } catch (error) {
    const response = apiErrorResponse(error);
    await log(principal, "GET", response.status, start);
    return response;
  }
}
