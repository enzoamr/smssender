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

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  statusCallback?: string;
  /** Messaging Service SID (pool d'expéditeurs). Prioritaire sur `from` si défini. */
  messagingServiceSid?: string;
}

/** Provider Twilio (Programmable Messaging). */
class TwilioProvider implements SmsProvider {
  readonly name = "twilio";

  constructor(private readonly config: TwilioConfig) {}

  async send(input: SendInput): Promise<SendResult> {
    // Import dynamique : le SDK n'est chargé que lorsque Twilio est réellement utilisé.
    const { default: twilio } = await import("twilio");
    const client = twilio(this.config.accountSid, this.config.authToken);
    const message = await client.messages.create({
      // Avec un Messaging Service, Twilio choisit l'expéditeur dans le pool ;
      // sinon on utilise le sender ID / numéro fourni par l'appelant.
      ...(this.config.messagingServiceSid
        ? { messagingServiceSid: this.config.messagingServiceSid }
        : { from: input.from }),
      to: input.to,
      body: input.text,
      ...(this.config.statusCallback
        ? { statusCallback: this.config.statusCallback }
        : {}),
    });
    return {
      providerId: message.sid,
      status: mapTwilioStatus(message.status),
    };
  }
}

/** Sélection du provider en fonction de l'environnement. */
export function getProvider(): SmsProvider {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (accountSid && authToken) {
    return new TwilioProvider({
      accountSid,
      authToken,
      statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    });
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
