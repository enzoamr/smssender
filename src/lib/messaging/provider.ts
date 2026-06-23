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
  /** Account SID, commence toujours par `AC`. */
  accountSid: string;
  /** Auth Token (mode d'auth simple). */
  authToken?: string;
  /** API Key SID, commence par `SK` (mode d'auth recommandé en prod). */
  apiKeySid?: string;
  /** Secret associé à l'API Key. */
  apiKeySecret?: string;
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
    // Deux modes d'authentification :
    //  • API Key (SK...) + secret : l'Account SID (AC...) est passé en option.
    //  • Auth Token : Account SID (AC...) + token.
    const client =
      this.config.apiKeySid && this.config.apiKeySecret
        ? twilio(this.config.apiKeySid, this.config.apiKeySecret, {
            accountSid: this.config.accountSid,
          })
        : twilio(this.config.accountSid, this.config.authToken);
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
  const apiKeySid = process.env.TWILIO_API_KEY_SID;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
  const common = {
    statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL,
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
  };

  // Auth par API Key (recommandé) : Account SID + API Key SID + secret.
  if (accountSid && apiKeySid && apiKeySecret) {
    return new TwilioProvider({ accountSid, apiKeySid, apiKeySecret, ...common });
  }
  // Auth par Auth Token : Account SID + token.
  if (accountSid && authToken) {
    return new TwilioProvider({ accountSid, authToken, ...common });
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
