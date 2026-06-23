import { NextResponse } from "next/server";
import { mapTwilioStatus } from "@/lib/messaging/provider";
import { updateMessageByProviderId } from "@/lib/messaging/store";

/**
 * Webhook de statut Twilio (Status Callback).
 *
 * Twilio POST en `application/x-www-form-urlencoded` à chaque changement d'état
 * (sent -> delivered/failed...). On retrouve le message par son `MessageSid`
 * (= providerId) et on met à jour son statut, qui se propage au dashboard.
 *
 * TODO(sécurité): valider la signature `X-Twilio-Signature` avec
 *   `twilio.validateRequest(authToken, signature, url, params)` avant de traiter.
 */

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = await request.formData();
  const sid = form.get("MessageSid")?.toString();
  const status = form.get("MessageStatus")?.toString();
  const errorCode = form.get("ErrorCode")?.toString() ?? null;

  if (!sid || !status) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await updateMessageByProviderId(sid, {
    status: mapTwilioStatus(status),
    errorCode,
  });

  // Twilio attend une réponse 2xx pour ne pas réessayer.
  return NextResponse.json({ ok: true });
}
