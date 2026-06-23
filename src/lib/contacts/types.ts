/**
 * Modèle des contacts (répertoire de destinataires).
 */

export type ContactStatus = "subscribed" | "unsubscribed";

export interface Contact {
  id: string;
  accountId: string;
  /** Numéro au format E.164, ex. +33612345678. */
  phone: string;
  name: string | null;
  /** Étiquette / liste optionnelle (ex. « Newsletter », « VIP »). */
  list: string | null;
  status: ContactStatus;
  createdAt: string;
  updatedAt: string;
}

/** Vue exposée à l'UI (sans l'accountId interne). */
export interface ContactView {
  id: string;
  phone: string;
  name: string | null;
  list: string | null;
  status: ContactStatus;
  createdAt: string;
}

export function toContactView(c: Contact): ContactView {
  return {
    id: c.id,
    phone: c.phone,
    name: c.name,
    list: c.list,
    status: c.status,
    createdAt: c.createdAt,
  };
}

/**
 * Normalise et valide un numéro au format international E.164.
 * Renvoie `null` si le format est invalide (doit commencer par `+`).
 */
export function normalizePhone(input: string): string | null {
  const cleaned = input.replace(/[\s().\-]/g, "");
  if (!/^\+\d{8,15}$/.test(cleaned)) return null;
  return cleaned;
}
