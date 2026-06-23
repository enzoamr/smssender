import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";
import { isAdminConfigured } from "@/lib/firebase/admin";

/**
 * Gestion de la session serveur via un cookie httpOnly.
 *  POST   { idToken }  -> vérifie le jeton Firebase (via JWKS, sans firebase-admin/auth)
 *                         et pose un cookie de session JWT signé avec SESSION_SECRET
 *  DELETE              -> supprime le cookie (déconnexion)
 */

export const runtime = "nodejs";

const SESSION_COOKIE = "session";
const EXPIRES_IN_SECS = 60 * 60 * 24 * 5; // 5 jours

// JWKS pour vérifier les ID tokens Firebase (RSA-256)
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

function getSessionKey(): Uint8Array {
  return Buffer.from(process.env.SESSION_SECRET!, "base64");
}

export async function POST(request: Request) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const hasSecret = Boolean(process.env.SESSION_SECRET);

  // Mode démo : Firebase ou SESSION_SECRET non configuré
  if (!isAdminConfigured() || !hasSecret || !projectId) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const { idToken } = (await request.json().catch(() => ({}))) as {
    idToken?: string;
  };
  if (!idToken) {
    return NextResponse.json({ error: "missing_id_token" }, { status: 400 });
  }

  try {
    // Vérification du Firebase ID token via JWKS (ESM jose, pas jwks-rsa)
    const { payload } = await jwtVerify(idToken, FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    // Émission d'un JWT de session signé avec notre propre clé
    const sessionJwt = await new SignJWT({
      email: payload.email,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(payload.sub!)
      .setIssuedAt()
      .setExpirationTime("5d")
      .sign(getSessionKey());

    const store = await cookies();
    store.set(SESSION_COOKIE, sessionJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: EXPIRES_IN_SECS,
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
