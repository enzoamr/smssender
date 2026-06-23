import { verifyApiKey, type ApiPrincipal } from "@/lib/api-keys/service";
import { API_KEY_HEADER, DEMO_ACCOUNT_ID } from "@/lib/config";
import { isAdminConfigured } from "@/lib/firebase/admin";
import { ApiError } from "./errors";

export type { ApiPrincipal };

/**
 * Authentifie une requête de l'API publique via la clé API du client.
 * En-tête attendu : `X-Api-Key: sk_live_...`
 *
 * La clé est hachée (SHA-256) et recherchée dans le store (collection
 * `api_keys`) pour résoudre le compte associé et vérifier l'état (active /
 * révoquée). Une clé de démo configurable reste acceptée pour les tests rapides.
 */
export async function authenticateApiKey(
  request: Request,
): Promise<ApiPrincipal> {
  const key = request.headers.get(API_KEY_HEADER);

  if (!key) {
    throw new ApiError(401, "unauthorized", "Clé API manquante (en-tête X-Api-Key).");
  }

  // Clé de démo : acceptée UNIQUEMENT en mode démo (Firebase non configuré),
  // jamais en production — sinon cette valeur publique permettrait d'envoyer
  // des SMS au frais du compte.
  const demoKey = process.env.DEMO_API_KEY;
  if (!isAdminConfigured() && demoKey && key === demoKey) {
    return { accountId: DEMO_ACCOUNT_ID, keyId: "key_demo" };
  }

  // Vérification réelle (hash + lookup).
  const principal = await verifyApiKey(key);
  if (!principal) {
    throw new ApiError(401, "unauthorized", "Clé API invalide ou révoquée.");
  }
  return principal;
}
