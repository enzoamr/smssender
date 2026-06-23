import { after, NextResponse } from "next/server";
import { mapTwilioCode, mapTwilioStatus } from "@/lib/messaging/provider";
import { updateMessageByProviderId } from "@/lib/messaging/store";
import { dispatchMessageStatus } from "@/lib/webhooks/service";

/**
 * Webhook de statut Twilio (Status Callback).
 *
 * Twilio POST en `application/x-www-form-urlencoded` à chaque changement d'état
 * (sent -> delivered/failed...). On retrouve le message par son `MessageSid`
 * (= providerId) et on met à jour son statut, qui se propage au dashboard.
 *
 * Sécurité : la requête est authentifiée via la signature `X-Twilio-Signature`
 * (HMAC du corps + URL avec l'auth token). Sans token configuré (mode démo),
 * la validation est ignorée.
 */

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = await request.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    params[key] = value.toString();
  }

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (authToken) {
    const signature = request.headers.get("x-twilio-signature");
    // URL exacte appelée par Twilio (doit correspondre à ce qui est configuré).
    const url = process.env.TWILIO_STATUS_CALLBACK_URL ?? request.url;
    const { default: twilio } = await import("twilio");
    const valid =
      signature != null &&
      twilio.validateRequest(authToken, signature, url, params);
    if (!valid) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
  }

  const sid = params.MessageSid;
  const status = params.MessageStatus;

  if (!sid || !status) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Normalise l'éventuel code d'erreur Twilio (livraison échouée en aval).
  const twilioCode = params.ErrorCode ? Number(params.ErrorCode) : null;
  const mappedError = mapTwilioCode(twilioCode);

  const updated = await updateMessageByProviderId(sid, {
    status: mapTwilioStatus(status),
    errorCode: mappedError?.code ?? null,
    errorMessage: mappedError?.message ?? null,
  });

  // Relais vers le webhook sortant du compte APRÈS la réponse à Twilio
  // (avec retries) : on ne bloque pas la réponse sur la livraison au client.
  if (updated) {
    after(async () => {
      await dispatchMessageStatus(updated);
    });
  }

  // Twilio attend une réponse 2xx pour ne pas réessayer.
  return NextResponse.json({ ok: true });
}
