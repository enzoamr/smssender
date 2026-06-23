"use client";

/**
 * Frontière d'erreur de dernier recours (remplace le root layout en cas
 * d'exception très haut dans l'arbre). Styles inline car le layout — donc les
 * styles globaux — n'est pas disponible ici.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "1.125rem", fontWeight: 600 }}>
          Une erreur est survenue
        </h1>
        <p style={{ color: "#6b7280", maxWidth: "28rem" }}>
          Rechargez la page ; si le problème persiste, contactez le support.
        </p>
        {error.digest ? (
          <p
            style={{ color: "#9ca3af", fontSize: "0.75rem", fontFamily: "monospace" }}
          >
            Réf. {error.digest}
          </p>
        ) : null}
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid #d1d5db",
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
