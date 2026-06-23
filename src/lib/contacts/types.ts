/**
 * Modèle des contacts (répertoire de destinataires).
 */

// Réexport pour compatibilité : la normalisation vit désormais dans lib/phone.
export { normalizePhone } from "@/lib/phone";

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
