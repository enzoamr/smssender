import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdminAuth, isAdminConfigured } from "@/lib/firebase/admin";

/**
 * Gestion de la session serveur via un cookie httpOnly.
 *  POST   { idToken }  -> vérifie le jeton (Admin SDK) et pose le cookie de session
 *  DELETE              -> supprime le cookie (déconnexion)
 */

export const runtime = "nodejs";

const SESSION_COOKIE = "session";
const EXPIRES_IN_MS = 60 * 60 * 24 * 5 * 1000; // 5 jours

export async function POST(request: Request) {
  // Mode démo : pas d'Admin configuré, on ne pose pas de cookie.
  if (!isAdminConfigured()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const { idToken } = (await request.json().catch(() => ({}))) as {
    idToken?: string;
  };
  if (!idToken) {
    return NextResponse.json({ error: "missing_id_token" }, { status: 400 });
  }

  try {
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn: EXPIRES_IN_MS,
    });
    const store = await cookies();
    store.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: EXPIRES_IN_MS / 1000,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }
}

export async function DELETE() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
