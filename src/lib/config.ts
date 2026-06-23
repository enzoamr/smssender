/**
 * Configuration centrale de l'application.
 * Le nom de marque est volontairement isolé ici pour être changé en un seul endroit.
 */
export const APP_NAME = "Sendly";
export const APP_DESCRIPTION =
  "Plateforme d'envoi de SMS pour les professionnels — API, campagnes et délivrabilité.";

/** Identifiant expéditeur par défaut (sender ID). Max 11 caractères alphanumériques. */
export const DEFAULT_SENDER = "Sendly";

/** Compte de démonstration utilisé tant que l'auth Firebase n'est pas branchée. */
export const DEMO_ACCOUNT_ID = "acct_demo";

/** En-tête HTTP attendu pour l'authentification de l'API publique (phase 2). */
export const API_KEY_HEADER = "x-api-key";
