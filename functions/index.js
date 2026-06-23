/**
 * Cloud Function planifiée : réveille périodiquement l'endpoint cron de l'app
 * (Vercel), qui exécute tous les jobs planifiés dus (rappels de RDV, envois
 * différés…).
 *
 * Toute la logique métier vit dans l'app Next.js : cette fonction ne fait
 * qu'appeler /api/cron/run avec le secret partagé. On garde ainsi une seule
 * source de vérité, et le déclencheur reste interchangeable.
 *
 * Déploiement : `firebase deploy --only functions` (nécessite le plan Blaze).
 * Secret : `firebase functions:secrets:set CRON_SECRET` (même valeur que sur Vercel).
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const { logger } = require("firebase-functions/v2");

// Endpoint cron de l'application. À adapter si le domaine change.
const APP_CRON_URL = "https://smssender-xi.vercel.app/api/cron/run";

// Secret partagé : doit valoir le même CRON_SECRET que sur Vercel.
const CRON_SECRET = defineSecret("CRON_SECRET");

exports.runScheduledJobs = onSchedule(
  {
    schedule: "every 1 minutes",
    region: "europe-west1",
    secrets: [CRON_SECRET],
    timeoutSeconds: 120,
  },
  async () => {
    const res = await fetch(APP_CRON_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${CRON_SECRET.value()}` },
    });
    const body = await res.text();

    if (!res.ok) {
      logger.error("Échec du cron", { status: res.status, body });
      throw new Error(`Cron HTTP ${res.status}`);
    }
    logger.info("Cron exécuté", { status: res.status, body });
  },
);
