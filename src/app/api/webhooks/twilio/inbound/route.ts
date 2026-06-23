import { NextResponse } from "next/server";
import { setStatusByPhone } from "@/lib/contacts/service";

/**
 * Webhook Twilio des messages ENTRANTS (réponses des destinataires).
 *
 * Sert la conformité opt-out : si la réponse est un mot-clé STOP, on désinscrit
 * le numéro sur toute la plateforme ; un mot-clé START le réabonne. Répond en
 * TwiML vide (aucune réponse automatique).
 *
 * À configurer dans Twilio : numéro → Messaging → « A message comes in » →
 * cette URL. La signature est vérifiée via l'Auth Token.
 */

export const runtime = "nodejs";

const STOP_KEYWORDS = new Set([
  "STOP",
  "STOPALL",
  "UNSUBSCRIBE",
  "CANCEL",
  "END",
  "QUIT",
  "ARRET",
  "ARRETER",
]);
const START_KEYWORDS = new Set(["START", "UNSTOP", "YES", "OUI"]);

function emptyTwiml(): Response {
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    { headers: { "Content-Type": "text/xml" } },
  );
}

export async function POST(request: Request) {
  const form = await request.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of form.entries()) params[key] = value.toString();

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (authToken) {
    const signature = request.headers.get("x-twilio-signature");
    const url = process.env.TWILIO_INBOUND_CALLBACK_URL ?? request.url;
    const { default: twilio } = await import("twilio");
    const valid =
      signature != null &&
      twilio.validateRequest(authToken, signature, url, params);
    if (!valid) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
  }

  const from = params.From;
  const keyword = (params.Body ?? "").trim().toUpperCase();

  if (from) {
    if (STOP_KEYWORDS.has(keyword)) {
      await setStatusByPhone(from, "unsubscribed");
    } else if (START_KEYWORDS.has(keyword)) {
      await setStatusByPhone(from, "subscribed");
    }
  }

  return emptyTwiml();
}
