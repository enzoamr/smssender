import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { DEMO_ACCOUNT_ID } from "@/lib/config";
import { isAdminConfigured } from "@/lib/firebase/admin";

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
 * Récupère l'utilisateur courant depuis le cookie de session (JWT signé avec
 * SESSION_SECRET). Renvoie `null` si non authentifié.
 *
 * En mode démo (Firebase ou SESSION_SECRET non configuré), renvoie un
 * utilisateur de démonstration pour que le tableau de bord reste accessible.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const secret = process.env.SESSION_SECRET;
  if (!isAdminConfigured() || !secret) return DEMO_USER;

  const session = (await cookies()).get("session")?.value;
  if (!session) return null;

  try {
    const key = Buffer.from(secret, "base64");
    const { payload } = await jwtVerify(session, key);
    return {
      uid: payload.sub!,
      email: (payload.email as string) ?? null,
      name: (payload.name as string) ?? null,
      accountId: payload.sub!,
      demo: false,
    };
  } catch {
    return null;
  }
}
