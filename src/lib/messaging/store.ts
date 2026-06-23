import { DEMO_ACCOUNT_ID } from "@/lib/config";
import { computeSegments } from "./segments";
import type { Message, MessageStatus } from "./types";

/**
 * Couche de persistance des messages.
 *
 * Tant que les identifiants Firebase Admin ne sont pas fournis, on retombe sur un
 * store en mémoire pré-rempli de données de démonstration : le tableau de bord
 * s'affiche et l'envoi fonctionne en local. Le branchement Firestore se fait
 * uniquement ici (les appelants — service, API — ne changent pas).
 *
 * TODO(firestore): remplacer le store mémoire par la collection `messages`
 *   via firebase-admin lorsque FIREBASE_* est configuré.
 */

const memoryStore: Message[] = seedDemoMessages();

export async function createMessage(message: Message): Promise<Message> {
  memoryStore.unshift(message);
  return message;
}

export async function updateMessage(
  id: string,
  patch: Partial<Message>,
): Promise<void> {
  const found = memoryStore.find((m) => m.id === id);
  if (found) Object.assign(found, patch, { updatedAt: new Date().toISOString() });
}

export async function updateMessageByProviderId(
  providerId: string,
  patch: Partial<Message>,
): Promise<void> {
  const found = memoryStore.find((m) => m.providerId === providerId);
  if (found) Object.assign(found, patch, { updatedAt: new Date().toISOString() });
}

export async function listMessages(
  accountId: string,
  limit = 100,
): Promise<Message[]> {
  return memoryStore
    .filter((m) => m.accountId === accountId)
    .slice(0, limit);
}

// --- Données de démonstration ---------------------------------------------

function seedDemoMessages(): Message[] {
  const samples: Array<{
    to: string;
    text: string;
    status: MessageStatus;
    hoursAgo: number;
  }> = [
    { to: "+33612345678", text: "Votre code de confirmation Sendly est 482913.", status: "DELIVERED", hoursAgo: 1 },
    { to: "+33698765432", text: "Promo flash 🎉 -30% sur tout le site jusqu'à minuit. STOP au 36111", status: "DELIVERED", hoursAgo: 2 },
    { to: "+33655443322", text: "Rappel : votre rendez-vous est demain à 14h.", status: "DELIVERED", hoursAgo: 4 },
    { to: "+33700112233", text: "Votre colis a été expédié et arrivera sous 48h.", status: "SENT", hoursAgo: 6 },
    { to: "+33611223344", text: "Merci pour votre commande ! Suivi : sndy.co/t/8821", status: "DELIVERED", hoursAgo: 9 },
    { to: "+33622334455", text: "Code OTP : 109284. Ne le partagez avec personne.", status: "FAILED", hoursAgo: 12 },
    { to: "+33633445566", text: "Nouvelle connexion détectée sur votre compte.", status: "DELIVERED", hoursAgo: 20 },
    { to: "+33644556677", text: "Soldes privées ce week-end, RDV en boutique !", status: "UNDELIVERED", hoursAgo: 26 },
    { to: "+33655667788", text: "Votre facture de juin est disponible.", status: "DELIVERED", hoursAgo: 30 },
    { to: "+33666778899", text: "Bienvenue chez Sendly 👋 Votre compte est actif.", status: "DELIVERED", hoursAgo: 48 },
    { to: "+33677889900", text: "Il reste 2 places pour le webinaire de jeudi.", status: "QUEUED", hoursAgo: 0 },
    { to: "+33688990011", text: "Votre abonnement a bien été renouvelé.", status: "DELIVERED", hoursAgo: 72 },
  ];

  const now = Date.now();
  return samples.map((s) => {
    const seg = computeSegments(s.text);
    const created = new Date(now - s.hoursAgo * 3600_000).toISOString();
    return {
      id: `msg_${crypto.randomUUID()}`,
      accountId: DEMO_ACCOUNT_ID,
      status: s.status,
      from: "Sendly",
      to: s.to,
      text: s.text,
      channel: "SMS",
      segmentCount: seg.segmentCount,
      encoding: seg.encoding,
      direction: "OUTBOUND",
      country: "FR",
      type: "text",
      providerId: `stub_${crypto.randomUUID()}`,
      price: seg.segmentCount * 0.045,
      errorCode: s.status === "FAILED" ? "30006" : null,
      source: "dashboard",
      scheduleAt: null,
      createdAt: created,
      updatedAt: created,
    } satisfies Message;
  });
}
