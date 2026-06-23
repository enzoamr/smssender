import { createHash } from "crypto";
import {
  createContact,
  createContacts,
  deleteContact,
  getContact,
  listContacts,
  updateContact,
} from "./store";
import {
  normalizePhone,
  toContactView,
  type Contact,
  type ContactStatus,
  type ContactView,
} from "./types";

/**
 * Logique métier des contacts : validation, déduplication, import.
 *
 * L'id d'un contact est déterministe (hash de accountId + numéro) : ré-ajouter
 * le même numéro mappe sur le même document plutôt que de créer un doublon.
 */

const MAX_IMPORT = 1000;

function contactId(accountId: string, phone: string): string {
  const h = createHash("sha1").update(`${accountId}:${phone}`).digest("hex");
  return `contact_${h.slice(0, 24)}`;
}

function buildContact(
  accountId: string,
  phone: string,
  name: string | null,
  list: string | null,
): Contact {
  const now = new Date().toISOString();
  return {
    id: contactId(accountId, phone),
    accountId,
    phone,
    name: name?.trim() ? name.trim().slice(0, 80) : null,
    list: list?.trim() ? list.trim().slice(0, 40) : null,
    status: "subscribed",
    createdAt: now,
    updatedAt: now,
  };
}

export interface AddContactResult {
  ok: boolean;
  error?: string;
}

export async function addContact(
  accountId: string,
  input: { phone: string; name?: string; list?: string },
): Promise<AddContactResult> {
  const phone = normalizePhone(input.phone);
  if (!phone) {
    return { ok: false, error: "Numéro invalide (format international, ex. +33612345678)." };
  }
  await createContact(
    buildContact(accountId, phone, input.name ?? null, input.list ?? null),
  );
  return { ok: true };
}

export interface ImportResult {
  ok: boolean;
  added: number;
  skipped: number;
  error?: string;
}

/**
 * Importe des contacts en masse. Une ligne = `numéro` ou `numéro,nom` ou
 * `numéro,nom,liste`. Les lignes invalides ou en double sont ignorées.
 */
export async function importContacts(
  accountId: string,
  raw: string,
): Promise<ImportResult> {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { ok: false, added: 0, skipped: 0, error: "Aucune ligne à importer." };
  }
  if (lines.length > MAX_IMPORT) {
    return {
      ok: false,
      added: 0,
      skipped: 0,
      error: `Trop de lignes (max ${MAX_IMPORT} par import).`,
    };
  }

  const seen = new Set<string>();
  const contacts: Contact[] = [];
  let skipped = 0;

  for (const line of lines) {
    const [rawPhone, rawName, rawList] = line
      .split(/[,;\t]/)
      .map((s) => s?.trim() ?? "");
    const phone = normalizePhone(rawPhone ?? "");
    if (!phone || seen.has(phone)) {
      skipped++;
      continue;
    }
    seen.add(phone);
    contacts.push(
      buildContact(accountId, phone, rawName || null, rawList || null),
    );
  }

  await createContacts(contacts);
  return { ok: true, added: contacts.length, skipped };
}

export async function listContactsForAccount(
  accountId: string,
): Promise<ContactView[]> {
  const contacts = await listContacts(accountId);
  return contacts.map(toContactView);
}

/** Supprime un contact — uniquement s'il appartient au compte. */
export async function removeContact(
  accountId: string,
  id: string,
): Promise<boolean> {
  const target = await getContact(id);
  if (!target || target.accountId !== accountId) return false;
  await deleteContact(id);
  return true;
}

/** Change le statut d'abonnement (opt-in / opt-out STOP). */
export async function setContactStatus(
  accountId: string,
  id: string,
  status: ContactStatus,
): Promise<boolean> {
  const target = await getContact(id);
  if (!target || target.accountId !== accountId) return false;
  await updateContact(id, { status, updatedAt: new Date().toISOString() });
  return true;
}
