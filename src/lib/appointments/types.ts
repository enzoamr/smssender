/**
 * Rendez-vous du calendrier. Chaque RDV génère des rappels SMS via la couche
 * scheduler générique (lib/scheduler) — il n'a aucune logique de cron propre.
 */

export interface Appointment {
  id: string;
  accountId: string;
  name: string;
  phone: string;
  /** Expéditeur (sender ID ou numéro) utilisé pour les rappels. */
  from: string;
  /** Date/heure du rendez-vous (ISO 8601, UTC). */
  startAt: string;
  /** Message de rappel envoyé par SMS. */
  message: string;
  /** Rappels en minutes AVANT le RDV (ex. [1440, 60] = 1 jour et 1 h avant). */
  reminders: number[];
  createdAt: string;
}

export interface AppointmentView {
  id: string;
  name: string;
  phone: string;
  from: string;
  startAt: string;
  message: string;
  reminders: number[];
}

export function toAppointmentView(a: Appointment): AppointmentView {
  return {
    id: a.id,
    name: a.name,
    phone: a.phone,
    from: a.from,
    startAt: a.startAt,
    message: a.message,
    reminders: a.reminders,
  };
}
