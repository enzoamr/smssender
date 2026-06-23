import { API_KEY_HEADER, DEMO_ACCOUNT_ID } from "@/lib/config";
import { ApiError } from "./errors";

export interface ApiPrincipal {
  accountId: string;
  keyId: string;
}

/**
 * Authentifie une requête de l'API publique via la clé API du client.
 * En-tête attendu : `X-Api-Key: sk_live_...`
 *
 * TODO(phase 2): hacher la clé (SHA-256) et la rechercher dans la collection
 *   `api_keys` (Firestore) pour résoudre le compte associé, vérifier le scope
 *   et l'état (révoquée/active), puis appliquer un rate limiting par clé.
 */
export async function authenticateApiKey(
  request: Request,
): Promise<ApiPrincipal> {
  const key = request.headers.get(API_KEY_HEADER);

  if (!key) {
    throw new ApiError(401, "unauthorized", "Clé API manquante (en-tête X-Api-Key).");
  }

  // Placeholder tant que le stockage des clés n'est pas branché : on accepte une
  // clé de démo configurable, sinon toute clé en environnement de développement.
  const demoKey = process.env.DEMO_API_KEY;
  if (demoKey && key === demoKey) {
    return { accountId: DEMO_ACCOUNT_ID, keyId: "key_demo" };
  }
  if (process.env.NODE_ENV !== "production") {
    return { accountId: DEMO_ACCOUNT_ID, keyId: "key_dev" };
  }

  throw new ApiError(401, "unauthorized", "Clé API invalide.");
}
