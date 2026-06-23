"use server";

import { revalidatePath } from "next/cache";
import {
  generateApiKey,
  revokeApiKey,
} from "@/lib/api-keys/service";
import type { ApiKeyView } from "@/lib/api-keys/types";
import { getCurrentUser } from "@/lib/auth/session";
import { DEMO_ACCOUNT_ID } from "@/lib/config";

export interface CreateKeyState {
  status: "idle" | "success" | "error";
  message: string;
  /** Clé en clair, renvoyée une seule fois pour affichage. */
  secret?: string;
  key?: ApiKeyView;
}

export async function createApiKeyAction(
  _prev: CreateKeyState,
  formData: FormData,
): Promise<CreateKeyState> {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length === 0) {
    return { status: "error", message: "Donnez un nom à votre clé." };
  }

  try {
    const accountId = (await getCurrentUser())?.accountId ?? DEMO_ACCOUNT_ID;
    const { view, secret } = await generateApiKey(accountId, name);
    revalidatePath("/dashboard/api-keys");
    return { status: "success", message: "Clé créée.", secret, key: view };
  } catch {
    return { status: "error", message: "Impossible de créer la clé." };
  }
}

export async function revokeApiKeyAction(
  keyId: string,
): Promise<{ ok: boolean }> {
  const accountId = (await getCurrentUser())?.accountId ?? DEMO_ACCOUNT_ID;
  const ok = await revokeApiKey(accountId, keyId);
  if (ok) revalidatePath("/dashboard/api-keys");
  return { ok };
}
