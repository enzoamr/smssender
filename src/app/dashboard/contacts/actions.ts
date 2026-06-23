"use server";

import { revalidatePath } from "next/cache";
import {
  addContact,
  importContacts,
  removeContact,
  setContactStatus,
} from "@/lib/contacts/service";
import { getCurrentUser } from "@/lib/auth/session";
import { DEMO_ACCOUNT_ID } from "@/lib/config";

async function currentAccountId(): Promise<string> {
  return (await getCurrentUser())?.accountId ?? DEMO_ACCOUNT_ID;
}

export interface ContactActionState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function addContactAction(
  _prev: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const phone = String(formData.get("phone") ?? "");
  const name = String(formData.get("name") ?? "");
  const list = String(formData.get("list") ?? "");

  const accountId = await currentAccountId();
  const result = await addContact(accountId, { phone, name, list });
  if (!result.ok) {
    return { status: "error", message: result.error ?? "Échec de l'ajout." };
  }
  revalidatePath("/dashboard/contacts");
  return { status: "success", message: "Contact ajouté." };
}

export async function importContactsAction(
  _prev: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const raw = String(formData.get("bulk") ?? "");

  const accountId = await currentAccountId();
  const result = await importContacts(accountId, raw);
  if (!result.ok) {
    return { status: "error", message: result.error ?? "Échec de l'import." };
  }
  revalidatePath("/dashboard/contacts");
  return {
    status: "success",
    message: `${result.added} contact(s) importé(s)${
      result.skipped > 0 ? `, ${result.skipped} ignoré(s)` : ""
    }.`,
  };
}

export async function deleteContactAction(
  id: string,
): Promise<{ ok: boolean }> {
  const accountId = await currentAccountId();
  const ok = await removeContact(accountId, id);
  if (ok) revalidatePath("/dashboard/contacts");
  return { ok };
}

export async function toggleContactStatusAction(
  id: string,
  status: "subscribed" | "unsubscribed",
): Promise<{ ok: boolean }> {
  const accountId = await currentAccountId();
  const ok = await setContactStatus(accountId, id, status);
  if (ok) revalidatePath("/dashboard/contacts");
  return { ok };
}
