"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Frontière d'erreur de l'application : capture les exceptions de rendu des
 * pages (au lieu d'afficher l'écran d'erreur brut de Next.js) et permet de
 * réessayer. La référence (digest) aide à retrouver l'erreur dans les logs.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="space-y-2">
        <h1 className="text-lg font-semibold">Une erreur est survenue</h1>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Quelque chose s&apos;est mal passé de notre côté. Réessayez ; si le
          problème persiste, contactez le support.
        </p>
        {error.digest ? (
          <p className="font-mono text-xs text-muted-foreground">
            Réf. {error.digest}
          </p>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button onClick={reset}>Réessayer</Button>
        <Button variant="outline" render={<a href="/dashboard" />}>
          Tableau de bord
        </Button>
      </div>
    </div>
  );
}
