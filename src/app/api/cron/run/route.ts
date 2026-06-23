import { NextResponse } from "next/server";
import { runDueJobs } from "@/lib/scheduler/service";

/**
 * Point d'entrée du cron : exécute tous les jobs planifiés dus.
 *
 * Déclencheur interchangeable (Firebase Scheduled Function, cron-job.org,
 * Vercel Cron…) : il suffit d'appeler cette URL périodiquement. Sécurisé par
 * CRON_SECRET, transmis soit en en-tête `Authorization: Bearer <secret>`, soit
 * en query `?key=<secret>`.
 *
 * Accepte GET et POST (selon ce que le déclencheur sait envoyer).
 */

export const runtime = "nodejs";

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // mode démo / non configuré
  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  const key = new URL(request.url).searchParams.get("key");
  return key === secret;
}

async function handle(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Secret cron invalide." } },
      { status: 401 },
    );
  }
  const result = await runDueJobs();
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
