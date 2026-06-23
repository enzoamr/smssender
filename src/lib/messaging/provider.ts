import type { MessageStatus } from "./types";

/**
 * Abstraction du fournisseur d'envoi de SMS.
 *
 * Twilio est aujourd'hui notre transport, mais tout passe par cette interface :
 * le jour où l'on ajoute un second provider (Vonage, Sinch...) ou un routage
 * multi-opérateurs, ni le service d'envoi ni l'API publique ne changent.
 */
export interface SendInput {
  from: string;
  to: string;
  text: string;
}

export interface SendResult {
  providerId: string;
  status: MessageStatus;
}

export interface SmsProvider {
  readonly name: string;
  send(input: SendInput): Promise<SendResult>;
}

/** Provider de secours : simule un envoi quand aucune clé Twilio n'est configurée. */
class StubProvider implements SmsProvider {
  readonly name = "stub";

  async send(): Promise<SendResult> {
    return {
      providerId: `stub_${crypto.randomUUID()}`,
      status: "SENT",
    };
  }
}

/** Provider Twilio (Programmable Messaging). */
class TwilioProvider implements SmsProvider {
  readonly name = "twilio";

  constructor(
    private readonly accountSid: string,
    private readonly authToken: string,
    private readonly statusCallback?: string,
  ) {}

  async send(input: SendInput): Promise<SendResult> {
    // Import dynamique : le SDK n'est chargé que lorsque Twilio est réellement utilisé.
    const { default: twilio } = await import("twilio");
    const client = twilio(this.accountSid, this.authToken);
    const message = await client.messages.create({
      from: input.from,
      to: input.to,
      body: input.text,
      ...(this.statusCallback ? { statusCallback: this.statusCallback } : {}),
    });
    return {
      providerId: message.sid,
      status: mapTwilioStatus(message.status),
    };
  }
}

/** Sélection du provider en fonction de l'environnement. */
export function getProvider(): SmsProvider {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (sid && token) {
    return new TwilioProvider(sid, token, process.env.TWILIO_STATUS_CALLBACK_URL);
  }
  return new StubProvider();
}

/** Traduit un statut Twilio vers notre statut interne normalisé. */
export function mapTwilioStatus(status: string | null | undefined): MessageStatus {
  switch (status) {
    case "queued":
    case "accepted":
    case "scheduled":
      return "QUEUED";
    case "sending":
      return "SENDING";
    case "sent":
      return "SENT";
    case "delivered":
      return "DELIVERED";
    case "undelivered":
      return "UNDELIVERED";
    case "failed":
      return "FAILED";
    default:
      return "QUEUED";
  }
}
