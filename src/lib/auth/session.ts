import { cookies } from "next/headers";
import { DEMO_ACCOUNT_ID } from "@/lib/config";
import { getAdminAuth, isAdminConfigured } from "@/lib/firebase/admin";

export interface SessionUser {
  uid: string;
  email: string | null;
  name: string | null;
  /** Compte (organisation) auquel rattacher les données. v1 : 1 utilisateur = 1 compte. */
  accountId: string;
  demo: boolean;
}

const DEMO_USER: SessionUser = {
  uid: "demo",
  email: "demo@sendly.app",
  name: "Compte démo",
  accountId: DEMO_ACCOUNT_ID,
  demo: true,
};

/**
 * Récupère l'utilisateur courant depuis le cookie de session (vérifié par
 * l'Admin SDK). Renvoie `null` si non authentifié.
 *
 * En mode démo (Firebase non configuré), renvoie un utilisateur de démonstration
 * pour que le tableau de bord reste accessible.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  if (!isAdminConfigured()) return DEMO_USER;

  const session = (await cookies()).get("session")?.value;
  if (!session) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(session, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: (decoded.name as string | undefined) ?? null,
      accountId: decoded.uid,
      demo: false,
    };
  } catch {
    return null;
  }
}
