"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { DEMO_ACCOUNT_ID } from "@/lib/config";
import { cancelJobs } from "@/lib/scheduler/service";

/**
 * Annule un élément planifié (un envoi, une campagne, ou tous les rappels d'un
 * RDV regroupés). On passe les ids des jobs sous-jacents ; seuls ceux du compte
 * et encore en attente sont réellement annulés.
 */
export async function cancelScheduledAction(
  jobIds: string[],
): Promise<{ ok: boolean; cancelled: number }> {
  const accountId = (await getCurrentUser())?.accountId ?? DEMO_ACCOUNT_ID;
  const cancelled = await cancelJobs(accountId, jobIds);
  if (cancelled > 0) revalidatePath("/dashboard/scheduled");
  return { ok: cancelled > 0, cancelled };
}
