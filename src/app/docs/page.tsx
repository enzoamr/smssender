import Link from "next/link";
import { ArrowUpRight, Terminal } from "lucide-react";
import { CodeBlock } from "@/components/dashboard/code-block";
import { Badge } from "@/components/ui/badge";
import { APP_NAME } from "@/lib/config";

export const metadata = {
  title: `Documentation API — ${APP_NAME}`,
  description: `Référence complète de l'API ${APP_NAME} : envoi de SMS, statuts, webhooks.`,
};

const BASE_URL = "https://smssender-xi.vercel.app";

const NAV = [
  { href: "#introduction", label: "Introduction" },
  { href: "#authentification", label: "Authentification" },
  { href: "#envoyer", label: "Envoyer un message" },
  { href: "#lister", label: "Lister les messages" },
  { href: "#modele", label: "Le modèle Message" },
  { href: "#statuts", label: "Statuts" },
  { href: "#webhooks", label: "Webhooks" },
  { href: "#erreurs", label: "Erreurs" },
  { href: "#limites", label: "Limites" },
];

function Method({ verb }: { verb: "POST" | "GET" }) {
  const cls =
    verb === "POST"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : "bg-sky-500/10 text-sky-600 dark:text-sky-400";
  return (
    <Badge variant="outline" className={`border-transparent font-mono ${cls}`}>
      {verb}
    </Badge>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  name,
  type,
  required,
  children,
}: {
  name: string;
  type: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b py-3 last:border-0">
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
          {name}
        </code>
        <span className="text-xs text-muted-foreground">{type}</span>
        {required ? (
          <span className="text-xs font-medium text-destructive">requis</span>
        ) : (
          <span className="text-xs text-muted-foreground">optionnel</span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-svh bg-background">
      {/* En-tête */}
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Terminal className="size-5 text-primary" />
            {APP_NAME}
            <span className="text-muted-foreground">/ docs</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            Tableau de bord
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[200px_1fr]">
        {/* Navigation latérale */}
        <aside className="hidden lg:block">
          <nav className="sticky top-20 space-y-1 text-sm">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Contenu */}
        <main className="min-w-0 space-y-12">
          <Section id="introduction" title="Introduction">
            <p className="text-sm text-muted-foreground">
              L&apos;API {APP_NAME} permet d&apos;envoyer des SMS et de suivre
              leur délivrabilité par programmation. Toutes les requêtes et
              réponses sont au format JSON, sur HTTPS.
            </p>
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-xs font-medium text-muted-foreground">
                URL de base
              </p>
              <code className="font-mono text-sm">{BASE_URL}/api/v1</code>
            </div>
          </Section>

          <Section id="authentification" title="Authentification">
            <p className="text-sm text-muted-foreground">
              Chaque requête doit inclure votre clé secrète dans l&apos;en-tête{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                X-Api-Key
              </code>
              . Créez et gérez vos clés depuis{" "}
              <Link
                href="/dashboard/api-keys"
                className="font-medium text-primary hover:underline"
              >
                Tableau de bord → Clés API
              </Link>
              . Une clé n&apos;est affichée en entier qu&apos;à sa création —
              conservez-la en lieu sûr et ne l&apos;exposez jamais côté client.
            </p>
            <CodeBlock>{`X-Api-Key: sk_live_votre_cle_secrete`}</CodeBlock>
          </Section>

          <Section id="envoyer" title="Envoyer un message">
            <div className="flex items-center gap-2">
              <Method verb="POST" />
              <code className="font-mono text-sm">/api/v1/messages</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Envoie un SMS à un ou plusieurs destinataires. Un envoi vers N
              numéros crée N messages, chacun suivi indépendamment. Les
              destinataires désinscrits (STOP) sont automatiquement exclus.
            </p>

            <h3 className="pt-2 text-sm font-semibold">
              Paramètres (objet <code>data</code>)
            </h3>
            <div className="rounded-lg border px-4">
              <Field name="from" type="string" required>
                Expéditeur : un sender ID alphanumérique (11 caractères max) ou
                un numéro au format E.164.
              </Field>
              <Field name="to" type="string | string[]" required>
                Un destinataire ou une liste, au format international E.164 (ex.{" "}
                <code className="text-xs">+33612345678</code>). 1000 max par
                requête.
              </Field>
              <Field name="text" type="string" required>
                Contenu du message (1530 caractères max). L&apos;encodage GSM-7
                ou Unicode et le nombre de segments sont calculés
                automatiquement.
              </Field>
              <Field name="scheduleAt" type="string (ISO 8601)">
                Pour différer l&apos;envoi : date/heure future au format ISO 8601
                (ex. <code className="text-xs">2026-06-25T14:30:00Z</code>). Omis
                ou dans le passé = envoi immédiat. Un envoi planifié est listé et
                annulable depuis Tableau de bord → Planifiés.
              </Field>
            </div>

            <h3 className="pt-2 text-sm font-semibold">Exemple — cURL</h3>
            <CodeBlock>{`curl ${BASE_URL}/api/v1/messages \\
  -X POST \\
  -H "X-Api-Key: sk_live_votre_cle" \\
  -H "Content-Type: application/json" \\
  -d '{
    "data": {
      "from": "Sendly",
      "to": ["+33612345678"],
      "text": "Bonjour depuis l'\\''API 👋"
    }
  }'`}</CodeBlock>

            <h3 className="pt-2 text-sm font-semibold">Exemple — JavaScript</h3>
            <CodeBlock>{`const res = await fetch("${BASE_URL}/api/v1/messages", {
  method: "POST",
  headers: {
    "X-Api-Key": "sk_live_votre_cle",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    data: { from: "Sendly", to: ["+33612345678"], text: "Bonjour 👋" },
  }),
});
const { data } = await res.json();`}</CodeBlock>

            <h3 className="pt-2 text-sm font-semibold">Exemple — Python</h3>
            <CodeBlock>{`import requests

res = requests.post(
    "${BASE_URL}/api/v1/messages",
    headers={"X-Api-Key": "sk_live_votre_cle"},
    json={"data": {
        "from": "Sendly",
        "to": ["+33612345678"],
        "text": "Bonjour 👋",
    }},
)
print(res.json())`}</CodeBlock>

            <h3 className="pt-2 text-sm font-semibold">
              Réponse <span className="font-mono text-xs">201 Created</span>
            </h3>
            <CodeBlock>{`{
  "data": [
    {
      "id": "msg_5f2c…",
      "account_id": "acct_…",
      "status": "QUEUED",
      "from": "Sendly",
      "to": "+33612345678",
      "text": "Bonjour 👋",
      "channel": "SMS",
      "segment_count": 1,
      "encoding": "STANDARD",
      "direction": "OUTBOUND",
      "country": "FR",
      "type": "text",
      "error_code": null,
      "error_message": null,
      "create_date": "2026-06-23T12:00:00.000Z",
      "update_date": "2026-06-23T12:00:00.000Z"
    }
  ]
}`}</CodeBlock>

            <h3 className="pt-2 text-sm font-semibold">
              Réponse{" "}
              <span className="font-mono text-xs">202 Accepted</span> — envoi
              planifié
            </h3>
            <p className="text-sm text-muted-foreground">
              Quand <code className="text-xs">scheduleAt</code> est dans le
              futur, le message n&apos;est pas envoyé tout de suite : il est mis
              en file d&apos;attente. La réponse décrit le job planifié (et non
              des messages). Vous le retrouvez dans Tableau de bord → Planifiés,
              où il reste annulable jusqu&apos;à son départ.
            </p>
            <CodeBlock>{`{
  "data": {
    "id": "job_5f2c…",
    "status": "scheduled",
    "from": "Sendly",
    "to": ["+33612345678"],
    "text": "Rappel : RDV demain à 14h",
    "schedule": "2026-06-25T14:30:00.000Z",
    "create_date": "2026-06-24T09:00:00.000Z"
  }
}`}</CodeBlock>
          </Section>

          <Section id="lister" title="Lister les messages">
            <div className="flex items-center gap-2">
              <Method verb="GET" />
              <code className="font-mono text-sm">/api/v1/messages</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Renvoie les messages de votre compte (les plus récents
              d&apos;abord). Le total est indiqué dans l&apos;en-tête de réponse{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                X-Total-Count
              </code>
              .
            </p>
            <CodeBlock>{`curl ${BASE_URL}/api/v1/messages \\
  -H "X-Api-Key: sk_live_votre_cle"`}</CodeBlock>
          </Section>

          <Section id="modele" title="Le modèle Message">
            <p className="text-sm text-muted-foreground">
              Champs renvoyés pour chaque message.
            </p>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">Champ</th>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    ["id", "string", "Identifiant unique du message."],
                    ["account_id", "string", "Compte émetteur."],
                    ["status", "string", "Statut courant (voir Statuts)."],
                    ["from", "string", "Expéditeur."],
                    ["to", "string", "Destinataire (E.164)."],
                    ["text", "string", "Contenu envoyé."],
                    ["channel", "string", "SMS."],
                    ["segment_count", "number", "Nombre de segments SMS."],
                    ["encoding", "string", "STANDARD (GSM-7) ou UNICODE."],
                    ["direction", "string", "OUTBOUND."],
                    ["country", "string | null", "Pays détecté (ISO-2)."],
                    ["type", "string", "text."],
                    ["error_code", "string | null", "Code d'erreur normalisé si échec (ex. invalid_recipient)."],
                    ["error_message", "string | null", "Motif d'échec lisible."],
                    ["create_date", "string", "Date de création (ISO 8601)."],
                    ["update_date", "string", "Dernière mise à jour (ISO 8601)."],
                  ].map(([f, t, d]) => (
                    <tr key={f}>
                      <td className="px-4 py-2">
                        <code className="font-mono text-xs">{f}</code>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {t}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="statuts" title="Statuts">
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <tbody className="divide-y">
                  {[
                    ["QUEUED", "Accepté par la plateforme, en attente d'envoi."],
                    ["SENDING", "En cours de transmission à l'opérateur."],
                    ["SENT", "Remis à l'opérateur."],
                    ["DELIVERED", "Délivrance confirmée par l'opérateur."],
                    ["UNDELIVERED", "L'opérateur n'a pas pu délivrer."],
                    ["FAILED", "Échec (numéro invalide, solde, etc.)."],
                  ].map(([s, d]) => (
                    <tr key={s}>
                      <td className="px-4 py-2 align-top">
                        <Badge variant="secondary" className="font-mono">
                          {s}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground">
              Quand un message a le statut{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">FAILED</code>{" "}
              ou{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                UNDELIVERED
              </code>
              , les champs{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                error_code
              </code>{" "}
              et{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                error_message
              </code>{" "}
              précisent la raison (ex. <code className="text-xs">invalid_recipient</code>,{" "}
              <code className="text-xs">recipient_blocked</code>,{" "}
              <code className="text-xs">unreachable</code>).
            </p>
          </Section>

          <Section id="webhooks" title="Webhooks">
            <p className="text-sm text-muted-foreground">
              Configurez une URL HTTPS depuis{" "}
              <Link
                href="/dashboard/webhooks"
                className="font-medium text-primary hover:underline"
              >
                Tableau de bord → Webhooks
              </Link>{" "}
              pour recevoir les changements de statut en temps réel. À chaque
              événement, {APP_NAME} envoie un{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">POST</code>{" "}
              à votre URL.
            </p>
            <h3 className="pt-2 text-sm font-semibold">Corps de l&apos;événement</h3>
            <CodeBlock>{`{
  "data": {
    "id": "msg_5f2c…",
    "request_id": null,
    "channel": "SMS",
    "status": "DELIVERED",
    "type": "STATUS",
    "to": "+33612345678",
    "error_code": null
  }
}`}</CodeBlock>
            <h3 className="pt-2 text-sm font-semibold">Vérifier la signature</h3>
            <p className="text-sm text-muted-foreground">
              Chaque requête porte un en-tête{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                X-Sendly-Signature
              </code>{" "}
              = HMAC-SHA256 (hex) du corps brut, signé avec le secret de votre
              endpoint. Recalculez-le et comparez pour authentifier la requête.
            </p>
            <CodeBlock>{`import { createHmac } from "crypto";

function verify(rawBody, signature, secret) {
  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return expected === signature;
}`}</CodeBlock>
          </Section>

          <Section id="erreurs" title="Erreurs et codes d'état">
            <p className="text-sm text-muted-foreground">
              En cas d&apos;erreur, l&apos;API renvoie un code HTTP approprié et
              un corps{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                {`{ "error": { "code", "message" } }`}
              </code>
              .
            </p>

            <h3 className="text-sm font-semibold">Codes d&apos;état HTTP</h3>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <tbody className="divide-y">
                  {[
                    ["200 / 201", "Succès — requête traitée (201 à la création d'un message)."],
                    ["400", "Requête invalide : paramètre manquant ou mal formé."],
                    ["401", "Non autorisé : clé API manquante, invalide ou révoquée."],
                    ["402", "Paiement requis : solde insuffisant (à venir)."],
                    ["403", "Accès refusé."],
                    ["404", "Ressource introuvable."],
                    ["429", "Trop de requêtes (limite de débit dépassée)."],
                    ["500", "Erreur interne du serveur."],
                    ["502 / 503", "Service momentanément indisponible."],
                  ].map(([h, d]) => (
                    <tr key={h}>
                      <td className="px-4 py-2 align-top">
                        <code className="font-mono text-xs">{h}</code>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="pt-2 text-sm font-semibold">
              Codes d&apos;erreur de l&apos;API
            </h3>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">HTTP</th>
                    <th className="px-4 py-2 font-medium">Code</th>
                    <th className="px-4 py-2 font-medium">Signification</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    ["400", "invalid_request", "Paramètre manquant ou invalide."],
                    ["400", "all_recipients_unsubscribed", "Tous les destinataires sont désinscrits (STOP)."],
                    ["401", "unauthorized", "Clé API manquante, invalide ou révoquée."],
                    ["429", "rate_limited", "Trop de requêtes (voir Limites)."],
                    ["500", "server_error", "Erreur interne du serveur."],
                  ].map(([h, c, d]) => (
                    <tr key={c}>
                      <td className="px-4 py-2">
                        <code className="font-mono text-xs">{h}</code>
                      </td>
                      <td className="px-4 py-2">
                        <code className="font-mono text-xs">{c}</code>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="limites" title="Limites">
            <div className="rounded-lg border px-4">
              <Field name="Débit" type="120 req / min / compte">
                Au-delà, l&apos;API renvoie{" "}
                <code className="text-xs">429 rate_limited</code>.
              </Field>
              <Field name="Destinataires" type="1000 / requête">
                Nombre maximum de numéros dans un seul appel.
              </Field>
              <Field name="Longueur" type="1530 caractères">
                Taille maximale du champ <code className="text-xs">text</code>.
              </Field>
            </div>
          </Section>

          <footer className="border-t pt-6 text-sm text-muted-foreground">
            Besoin d&apos;aide ? Retrouvez vos clés et journaux dans le{" "}
            <Link
              href="/dashboard"
              className="font-medium text-primary hover:underline"
            >
              tableau de bord
            </Link>
            .
          </footer>
        </main>
      </div>
    </div>
  );
}
