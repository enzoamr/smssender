import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import type { Appointment } from "./types";

/**
 * Persistance des rendez-vous (collection `appointments`).
 * Firestore ou mémoire selon la configuration.
 */

const COLLECTION = "appointments";
const memoryStore: Appointment[] = [];

function useFirestore(): boolean {
  return isAdminConfigured();
}

export async function createAppointment(
  appointment: Appointment,
): Promise<Appointment> {
  if (useFirestore()) {
    await getAdminDb()
      .collection(COLLECTION)
      .doc(appointment.id)
      .set(appointment);
    return appointment;
  }
  memoryStore.unshift(appointment);
  return appointment;
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  if (useFirestore()) {
    const doc = await getAdminDb().collection(COLLECTION).doc(id).get();
    return doc.exists ? (doc.data() as Appointment) : null;
  }
  return memoryStore.find((a) => a.id === id) ?? null;
}

export async function listAppointments(
  accountId: string,
  limit = 1000,
): Promise<Appointment[]> {
  if (useFirestore()) {
    const snap = await getAdminDb()
      .collection(COLLECTION)
      .where("accountId", "==", accountId)
      .limit(limit)
      .get();
    return snap.docs
      .map((d) => d.data() as Appointment)
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
  }
  return memoryStore
    .filter((a) => a.accountId === accountId)
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .slice(0, limit);
}

export async function deleteAppointment(id: string): Promise<void> {
  if (useFirestore()) {
    await getAdminDb().collection(COLLECTION).doc(id).delete();
    return;
  }
  const idx = memoryStore.findIndex((a) => a.id === id);
  if (idx >= 0) memoryStore.splice(idx, 1);
}
