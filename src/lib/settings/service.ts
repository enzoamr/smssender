import { DEFAULT_SENDER } from "@/lib/config";
import { getStoredSettings, saveStoredSettings } from "./store";
import type { AccountSettingsView } from "./types";

/**
 * Logique des réglages de compte, avec valeurs par défaut.
 */

export async function getSettings(
  accountId: string,
): Promise<AccountSettingsView> {
  const stored = await getStoredSettings(accountId);
  return {
    organizationName: stored?.organizationName ?? "",
    defaultSender: stored?.defaultSender || DEFAULT_SENDER,
  };
}

export interface SaveResult {
  ok: boolean;
  error?: string;
}

export async function saveSettings(
  accountId: string,
  input: { organizationName: string; defaultSender: string },
): Promise<SaveResult> {
  const organizationName = input.organizationName.trim().slice(0, 60);
  const defaultSender = input.defaultSender.trim();

  if (defaultSender.length > 11) {
    return { ok: false, error: "L'expéditeur ne peut pas dépasser 11 caractères." };
  }
  if (defaultSender && !/^[A-Za-z0-9 +]+$/.test(defaultSender)) {
    return { ok: false, error: "Expéditeur invalide (lettres, chiffres et espaces)." };
  }

  await saveStoredSettings({
    accountId,
    organizationName,
    defaultSender: defaultSender || DEFAULT_SENDER,
    updatedAt: new Date().toISOString(),
  });
  return { ok: true };
}
