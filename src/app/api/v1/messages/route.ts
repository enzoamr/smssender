import { NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api/auth";
import { apiErrorResponse } from "@/lib/api/errors";
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
 * -> déléguer au service -> formater la réponse.
 *
 * Contrat aligné sur TopMessage :
 *   POST /api/v1/messages   body { data: { from, to[], text } }  -> 201 { data: [...] }
 *   GET  /api/v1/messages                                        -> 200 { data: [...] }
 */

export const runtime = "nodejs";

interface SendBody {
  data?: SendMessageInput;
}

export async function POST(request: Request) {
  try {
    const principal = await authenticateApiKey(request);
    const body = (await request.json().catch(() => ({}))) as SendBody;
    const payload = body.data ?? (body as SendMessageInput);

    const messages = await sendMessage(payload, {
      accountId: principal.accountId,
      source: "api",
    });

    return NextResponse.json(
      { data: messages.map(toApiMessage) },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function GET(request: Request) {
  try {
    const principal = await authenticateApiKey(request);
    const messages = await listMessages(principal.accountId);

    return NextResponse.json(
      { data: messages.map(toApiMessage) },
      { headers: { "X-Total-Count": String(messages.length) } },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
