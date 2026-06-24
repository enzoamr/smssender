"use server";

import { revalidatePath } from "next/cache";
import {
  addAppointment,
  removeAppointment,
} from "@/lib/appointments/service";
import { getCurrentUser } from "@/lib/auth/session";
import { DEMO_ACCOUNT_ID } from "@/lib/config";

async function currentAccountId(): Promise<string> {
  return (await getCurrentUser())?.accountId ?? DEMO_ACCOUNT_ID;
}

export interface AppointmentActionState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function createAppointmentAction(
  _prev: AppointmentActionState,
  formData: FormData,
): Promise<AppointmentActionState> {
  const name = String(formData.get("name") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const from = String(formData.get("from") ?? "");
  // startAt est calculé côté client (fuseau de l'utilisateur) puis envoyé en ISO.
  const startAt = String(formData.get("startAt") ?? "");
  const message = String(formData.get("message") ?? "");
  const reminders = formData
    .getAll("reminders")
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));

  if (!startAt || Number.isNaN(Date.parse(startAt))) {
    return { status: "error", message: "Date et heure requises." };
  }

  const accountId = await currentAccountId();
  const result = await addAppointment(accountId, {
    name,
    phone,
    from,
    startAt,
    message,
    reminders,
  });
  if (!result.ok) {
    return { status: "error", message: result.error ?? "Échec de la création." };
  }
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/scheduled");
  return {
    status: "success",
    message: `Rendez-vous créé (${result.appointment?.reminders.length ?? 0} rappel(s) programmé(s)).`,
  };
}

export async function deleteAppointmentAction(
  id: string,
): Promise<{ ok: boolean }> {
  const accountId = await currentAccountId();
  const ok = await removeAppointment(accountId, id);
  if (ok) {
    revalidatePath("/dashboard/calendar");
    revalidatePath("/dashboard/scheduled");
  }
  return { ok };
}
