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

/**
 * Erreur d'envoi normalisée. Le code est le NÔTRE (jamais le code brut du
 * provider) afin de garder la surcouche étanche tout en restant explicite.
 */
export class ProviderError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

interface NormalizedError {
  code: string;
  message: string;
}

const GENERIC_FAILURE: NormalizedError = {
  code: "delivery_failed",
  message: "Échec de remise par l'opérateur.",
};

const TWILIO_ERROR_TABLE: Record<number, NormalizedError> = {
  21211: { code: "invalid_recipient", message: "Numéro destinataire invalide." },
  21214: { code: "invalid_recipient", message: "Numéro destinataire injoignable." },
  21614: { code: "invalid_recipient", message: "Le numéro n'est pas un mobile valide." },
  30005: { code: "invalid_recipient", message: "Numéro destinataire inconnu." },
  21610: { code: "recipient_blocked", message: "Destinataire désinscrit (STOP)." },
  30007: { code: "blocked_spam", message: "Message bloqué par le filtre anti-spam de l'opérateur." },
  21408: { code: "region_not_enabled", message: "Envoi non autorisé vers cette région." },
  30006: { code: "unreachable", message: "Numéro fixe ou opérateur injoignable." },
  30003: { code: "unreachable", message: "Combiné destinataire injoignable." },
  21606: { code: "invalid_sender", message: "Expéditeur invalide ou non autorisé." },
  21660: { code: "invalid_sender", message: "Expéditeur non valide pour ce destinataire." },
  20003: { code: "provider_auth", message: "Authentification opérateur refusée." },
};

/**
 * Traduit un code d'erreur Twilio (numérique) en code normalisé + message
 * lisible. Renvoie `null` si aucun code (= pas d'erreur).
 */
export function mapTwilioCode(
  code: number | null | undefined,
): NormalizedError | null {
  if (code == null) return null;
  return TWILIO_ERROR_TABLE[code] ?? GENERIC_FAILURE;
}

/** Traduit une exception du SDK Twilio en erreur d'envoi normalisée. */
export function mapTwilioError(error: unknown): ProviderError {
  const raw = (error as { code?: number })?.code;
  const mapped = mapTwilioCode(typeof raw === "number" ? raw : null) ?? GENERIC_FAILURE;
  return new ProviderError(mapped.code, mapped.message);
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
    try {
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
    } catch (error) {
      // Erreur normalisée (le code Twilio brut n'est jamais exposé au client).
      throw mapTwilioError(error);
    }
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
