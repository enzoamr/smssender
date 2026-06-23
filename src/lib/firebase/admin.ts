import {
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * SDK Firebase Admin (serveur uniquement).
 * Utilisé par les Route Handlers / Server Actions pour vérifier les sessions et
 * accéder à Firestore avec des privilèges élevés. Les identifiants proviennent
 * d'un compte de service (variables FIREBASE_*, jamais exposées au client).
 */
let cachedApp: App | null = null;

/**
 * Normalise la clé privée lue depuis une variable d'environnement.
 *
 * Les copier-coller dans Vercel introduisent souvent des erreurs de format qui
 * font échouer le parsing PEM (`DECODER routines::unsupported`). On absorbe ici
 * les cas les plus courants :
 *   • guillemets englobants laissés par mégarde (`"...."` / `'....'`) ;
 *   • clé encodée en Base64 (alternative robuste, sans \n ni guillemets) ;
 *   • sauts de ligne échappés `\n` à reconvertir en vrais retours.
 */
function normalizePrivateKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let key = raw.trim();

  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }

  // Clé fournie en Base64 (ne contient pas l'en-tête PEM en clair) : on décode.
  if (!key.includes("BEGIN")) {
    try {
      const decoded = Buffer.from(key, "base64").toString("utf8");
      if (decoded.includes("BEGIN")) key = decoded;
    } catch {
      // On garde la valeur d'origine si le décodage échoue.
    }
  }

  return key.replace(/\\n/g, "\n");
}

export function isAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );
}

export function getAdminApp(): App {
  if (!isAdminConfigured()) {
    throw new Error(
      "Firebase Admin n'est pas configuré. Renseignez FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL et FIREBASE_PRIVATE_KEY.",
    );
  }
  if (cachedApp) return cachedApp;
  if (getApps().length) {
    cachedApp = getApps()[0]!;
    return cachedApp;
  }
  cachedApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    }),
  });
  return cachedApp;
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
