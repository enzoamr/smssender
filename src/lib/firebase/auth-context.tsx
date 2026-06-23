"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";

export interface AuthUser {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
  demo?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  configured: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (name: string, email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const DEMO_USER: AuthUser = {
  uid: "demo",
  email: "demo@sendly.app",
  name: "Compte démo",
  photoURL: null,
  demo: true,
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Échange le jeton Firebase contre un cookie de session httpOnly côté serveur. */
async function createServerSession(idToken: string) {
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isFirebaseConfigured();
  const router = useRouter();
  // Sans Firebase configuré : mode démo (aucune authentification requise).
  const [user, setUser] = useState<AuthUser | null>(
    configured ? null : DEMO_USER,
  );
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return;
    return onAuthStateChanged(getFirebaseAuth(), (fbUser: User | null) => {
      setUser(
        fbUser
          ? {
              uid: fbUser.uid,
              email: fbUser.email,
              name: fbUser.displayName,
              photoURL: fbUser.photoURL,
            }
          : null,
      );
      setLoading(false);
    });
  }, [configured]);

  async function finalize(fbUser: User) {
    await createServerSession(await fbUser.getIdToken());
    router.push("/dashboard");
    router.refresh();
  }

  const value: AuthContextValue = {
    user,
    loading,
    configured,
    async signInEmail(email, password) {
      const cred = await signInWithEmailAndPassword(
        getFirebaseAuth(),
        email,
        password,
      );
      await finalize(cred.user);
    },
    async signUpEmail(name, email, password) {
      const cred = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        email,
        password,
      );
      if (name) await updateProfile(cred.user, { displayName: name });
      await finalize(cred.user);
    },
    async signInGoogle() {
      const cred = await signInWithPopup(
        getFirebaseAuth(),
        new GoogleAuthProvider(),
      );
      await finalize(cred.user);
    },
    async signOutUser() {
      if (configured) await signOut(getFirebaseAuth());
      await fetch("/api/auth/session", { method: "DELETE" });
      router.push("/login");
      router.refresh();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider.");
  return ctx;
}
