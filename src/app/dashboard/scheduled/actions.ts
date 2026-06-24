"use server";

import { revalidatePath } from "next/cache";
import { removeAppointment } from "@/lib/appointments/service";
import { getCurrentUser } from "@/lib/auth/session";
import { DEMO_ACCOUNT_ID } from "@/lib/config";
import { cancelJobs } from "@/lib/scheduler/service";

/**
 * Annule un élément planifié depuis « Planifiés ».
 *
 * La suppression cascade vers la SOURCE pour rester cohérent partout :
 *  - rappel(s) de RDV (refType "appointment") -> supprime le rendez-vous, ce qui
 *    annule du même coup tous ses rappels et le retire du calendrier ;
 *  - envoi planifié / campagne (aucune autre source) -> annule simplement le(s)
 *    job(s).
 */
export async function cancelScheduledAction(input: {
  jobIds: string[];
  refType: string | null;
  refId: string | null;
}): Promise<{ ok: boolean }> {
  const accountId = (await getCurrentUser())?.accountId ?? DEMO_ACCOUNT_ID;

  let ok: boolean;
  if (input.refType === "appointment" && input.refId) {
    ok = await removeAppointment(accountId, input.refId);
    if (ok) revalidatePath("/dashboard/calendar");
  } else {
    ok = (await cancelJobs(accountId, input.jobIds)) > 0;
  }

  if (ok) revalidatePath("/dashboard/scheduled");
  return { ok };
}
