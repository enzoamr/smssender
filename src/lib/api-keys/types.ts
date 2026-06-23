/**
 * Modèle des clés API publiques.
 *
 * Règle de sécurité : la clé en clair (`sk_live_…`) n'est JAMAIS stockée. On ne
 * conserve que son hash SHA-256 (pour la vérification) et un aperçu masqué (pour
 * l'affichage). La clé complète n'est montrée qu'une seule fois, à la création.
 */

export type ApiKeyStatus = "active" | "revoked";

/** Clé telle que persistée (Firestore / mémoire). */
export interface ApiKey {
  id: string;
  accountId: string;
  name: string;
  /** SHA-256 (hex) de la clé complète. */
  hash: string;
  /** Aperçu masqué, ex. `sk_live_a1b2••••••••wxyz`. */
  masked: string;
  status: ApiKeyStatus;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

/** Vue exposée à l'UI : surtout, ne contient jamais le `hash`. */
export interface ApiKeyView {
  id: string;
  name: string;
  masked: string;
  status: ApiKeyStatus;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export function toApiKeyView(k: ApiKey): ApiKeyView {
  return {
    id: k.id,
    name: k.name,
    masked: k.masked,
    status: k.status,
    createdAt: k.createdAt,
    lastUsedAt: k.lastUsedAt,
    revokedAt: k.revokedAt,
  };
}
