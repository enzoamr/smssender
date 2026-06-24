import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import type { Contact } from "./types";

/**
 * Persistance des contacts (collection `contacts`).
 * Firestore dès que FIREBASE_* est configuré, sinon store mémoire (démo).
 */

const COLLECTION = "contacts";
const memoryStore: Contact[] = [];

function isFirestore(): boolean {
  return isAdminConfigured();
}

export async function createContact(contact: Contact): Promise<Contact> {
  if (isFirestore()) {
    await getAdminDb().collection(COLLECTION).doc(contact.id).set(contact);
    return contact;
  }
  upsertMemory(contact);
  return contact;
}

/** Insertion en masse (import). Utilise des batches Firestore (max 500/op). */
export async function createContacts(contacts: Contact[]): Promise<void> {
  if (contacts.length === 0) return;
  if (isFirestore()) {
    const db = getAdminDb();
    for (let i = 0; i < contacts.length; i += 500) {
      const batch = db.batch();
      for (const c of contacts.slice(i, i + 500)) {
        batch.set(db.collection(COLLECTION).doc(c.id), c);
      }
      await batch.commit();
    }
    return;
  }
  for (const c of contacts) upsertMemory(c);
}

export async function getContact(id: string): Promise<Contact | null> {
  if (isFirestore()) {
    const doc = await getAdminDb().collection(COLLECTION).doc(id).get();
    return doc.exists ? (doc.data() as Contact) : null;
  }
  return memoryStore.find((c) => c.id === id) ?? null;
}

/** Tous les contacts (tous comptes) ayant ce numéro — pour l'opt-out STOP entrant. */
export async function findContactsByPhone(phone: string): Promise<Contact[]> {
  if (isFirestore()) {
    const snap = await getAdminDb()
      .collection(COLLECTION)
      .where("phone", "==", phone)
      .get();
    return snap.docs.map((d) => d.data() as Contact);
  }
  return memoryStore.filter((c) => c.phone === phone);
}

export async function listContacts(
  accountId: string,
  limit = 1000,
): Promise<Contact[]> {
  if (isFirestore()) {
    const snap = await getAdminDb()
      .collection(COLLECTION)
      .where("accountId", "==", accountId)
      .limit(limit)
      .get();
    return snap.docs
      .map((d) => d.data() as Contact)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return memoryStore
    .filter((c) => c.accountId === accountId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function updateContact(
  id: string,
  patch: Partial<Contact>,
): Promise<void> {
  if (isFirestore()) {
    await getAdminDb().collection(COLLECTION).doc(id).set(patch, { merge: true });
    return;
  }
  const found = memoryStore.find((c) => c.id === id);
  if (found) Object.assign(found, patch);
}

export async function deleteContact(id: string): Promise<void> {
  if (isFirestore()) {
    await getAdminDb().collection(COLLECTION).doc(id).delete();
    return;
  }
  const idx = memoryStore.findIndex((c) => c.id === id);
  if (idx >= 0) memoryStore.splice(idx, 1);
}

function upsertMemory(contact: Contact): void {
  const idx = memoryStore.findIndex((c) => c.id === contact.id);
  if (idx >= 0) memoryStore[idx] = contact;
  else memoryStore.unshift(contact);
}
