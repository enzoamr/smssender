import { randomUUID } from "crypto";
import { normalizePhone } from "@/lib/phone";
import { cancelJobsByRef, scheduleMessage } from "@/lib/scheduler/service";
import { getSettings } from "@/lib/settings/service";
import {
  createAppointment,
  deleteAppointment,
  getAppointment,
  listAppointments,
} from "./store";
import {
  toAppointmentView,
  type Appointment,
  type AppointmentView,
} from "./types";

const REF_TYPE = "appointment";
const MAX_REMINDERS = 5;

export interface CreateAppointmentInput {
  name: string;
  phone: string;
  from: string;
  startAt: string;
  message: string;
  reminders: number[];
}

export interface CreateResult {
  ok: boolean;
  error?: string;
  appointment?: AppointmentView;
}

/**
 * Crée un rendez-vous ET planifie ses rappels SMS via le scheduler générique.
 * Chaque rappel devient un job lié au RDV (ref appointment/<id>), ce qui permet
 * de tous les annuler si le RDV est supprimé.
 */
export async function addAppointment(
  accountId: string,
  input: CreateAppointmentInput,
): Promise<CreateResult> {
  const name = input.name.trim();
  const message = input.message.trim();
  const phone = normalizePhone(input.phone);
  const startMs = Date.parse(input.startAt);

  if (!name) return { ok: false, error: "Nom requis." };
  if (!phone) {
    return { ok: false, error: "Numéro invalide (format international, ex. +33612345678)." };
  }
  if (Number.isNaN(startMs)) return { ok: false, error: "Date/heure invalide." };
  if (!message) return { ok: false, error: "Message de rappel requis." };

  // Expéditeur : celui choisi, sinon l'expéditeur par défaut du compte.
  const from =
    input.from.trim().slice(0, 16) ||
    (await getSettings(accountId)).defaultSender;

  const reminders = Array.from(new Set(input.reminders))
    .filter((m) => Number.isFinite(m) && m >= 0)
    .sort((a, b) => b - a)
    .slice(0, MAX_REMINDERS);

  const now = new Date().toISOString();
  const appointment: Appointment = {
    id: `appt_${randomUUID()}`,
    accountId,
    name: name.slice(0, 80),
    phone,
    from,
    startAt: new Date(startMs).toISOString(),
    message: message.slice(0, 1530),
    reminders,
    createdAt: now,
  };
  await createAppointment(appointment);

  // Planifie chaque rappel encore dans le futur via la couche scheduler.
  await Promise.all(
    reminders.map((minutes) => {
      const runAt = startMs - minutes * 60_000;
      if (runAt <= Date.now()) return Promise.resolve();
      return scheduleMessage(
        accountId,
        new Date(runAt),
        { from, to: phone, text: message },
        { type: REF_TYPE, id: appointment.id },
      );
    }),
  );

  return { ok: true, appointment: toAppointmentView(appointment) };
}

export async function listAppointmentsForAccount(
  accountId: string,
): Promise<AppointmentView[]> {
  const appointments = await listAppointments(accountId);
  return appointments.map(toAppointmentView);
}

/** Supprime un RDV et annule ses rappels encore en attente. */
export async function removeAppointment(
  accountId: string,
  id: string,
): Promise<boolean> {
  const target = await getAppointment(id);
  if (!target || target.accountId !== accountId) return false;
  await deleteAppointment(id);
  await cancelJobsByRef(REF_TYPE, id);
  return true;
}
