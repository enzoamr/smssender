import { DEMO_ACCOUNT_ID } from "@/lib/config";
import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { computeSegments } from "./segments";
import type { Message, MessageStatus } from "./types";

/**
 * Couche de persistance des messages.
 *
 * Deux back-ends, choisis automatiquement :
 *   • Firestore (collection `messages`) dès que FIREBASE_* est configuré — prod.
 *   • Store en mémoire pré-rempli de données de démonstration sinon — pratique
 *     pour développer l'UI sans comptes externes.
 *
 * Les appelants (service, API, webhooks) ne connaissent que ces 4 fonctions :
 * tout le branchement vit ici.
 */

const COLLECTION = "messages";

// --- Store en mémoire (mode démo) -----------------------------------------
const memoryStore: Message[] = seedDemoMessages();

/** Vrai si l'on doit lire/écrire dans Firestore plutôt que dans le store mémoire. */
function useFirestore(): boolean {
  return isAdminConfigured();
}

export async function createMessage(message: Message): Promise<Message> {
  if (useFirestore()) {
    await getAdminDb().collection(COLLECTION).doc(message.id).set(message);
    return message;
  }
  memoryStore.unshift(message);
  return message;
}

export async function updateMessage(
  id: string,
  patch: Partial<Message>,
): Promise<void> {
  const updatedAt = new Date().toISOString();
  if (useFirestore()) {
    await getAdminDb()
      .collection(COLLECTION)
      .doc(id)
      .set({ ...patch, updatedAt }, { merge: true });
    return;
  }
  const found = memoryStore.find((m) => m.id === id);
  if (found) Object.assign(found, patch, { updatedAt });
}

export async function updateMessageByProviderId(
  providerId: string,
  patch: Partial<Message>,
): Promise<void> {
  const updatedAt = new Date().toISOString();
  if (useFirestore()) {
    const snap = await getAdminDb()
      .collection(COLLECTION)
      .where("providerId", "==", providerId)
      .limit(1)
      .get();
    if (!snap.empty) {
      await snap.docs[0].ref.set({ ...patch, updatedAt }, { merge: true });
    }
    return;
  }
  const found = memoryStore.find((m) => m.providerId === providerId);
  if (found) Object.assign(found, patch, { updatedAt });
}

export async function listMessages(
  accountId: string,
  limit = 100,
): Promise<Message[]> {
  if (useFirestore()) {
    const col = getAdminDb().collection(COLLECTION);
    try {
      // Chemin optimal : tri côté Firestore (nécessite un index composite
      // accountId + createdAt, fourni dans firestore.indexes.json).
      const snap = await col
        .where("accountId", "==", accountId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();
      return snap.docs.map((d) => d.data() as Message);
    } catch {
      // L'index composite n'existe pas encore : on retombe sur un tri en mémoire
      // pour que le tableau de bord fonctionne immédiatement, sans configuration.
      const snap = await col.where("accountId", "==", accountId).get();
      return snap.docs
        .map((d) => d.data() as Message)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit);
    }
  }
  return memoryStore.filter((m) => m.accountId === accountId).slice(0, limit);
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
