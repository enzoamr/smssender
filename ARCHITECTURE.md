# Architecture — Sendly

Plateforme SaaS d'envoi de SMS (façon TopMessage / Twilio) : tableau de bord
client + admin, API publique, facturation à l'usage.

## Stack

| Couche        | Choix                                                        |
| ------------- | ----------------------------------------------------------- |
| Front / API   | **Next.js 16** (App Router, Server Actions, Route Handlers) |
| UI            | **Tailwind v4 + shadcn/ui** (Base UI), thème clair/sombre   |
| Auth          | **Firebase Auth**                                           |
| Données       | **Firestore** (via Firebase Admin côté serveur)             |
| SMS           | **Twilio** (derrière une interface `SmsProvider`)           |
| Paiement      | **Stripe Billing** (abonnement + usage metering)            |
| Hébergement   | **Vercel**                                                  |

## Le principe central : une seule « surcouche » d'envoi

> **Question :** le dashboard envoie-t-il via notre API perso (la surcouche) ou
> via Twilio directement ?
>
> **Réponse : via la surcouche.** Mais « surcouche » = une **couche de service
> partagée en interne**, pas un appel HTTP du site vers sa propre API.

```
                         ┌──────────────────────────┐
   Tableau de bord  ───▶ │                          │
   (Server Action,       │   sendMessage()          │ ───▶  Twilio
    session user)        │   = LA surcouche         │      (SmsProvider)
                         │                          │
   API publique     ───▶ │   validation · segments  │
   /api/v1/messages      │   crédits · persistance  │
   (clé API client)      │   statut · webhooks      │
                         └──────────────────────────┘
```

- **Twilio** n'est qu'un *transport*, isolé derrière l'interface `SmsProvider`
  (`src/lib/messaging/provider.ts`). On peut le remplacer/router sans toucher au
  reste.
- **`sendMessage()`** (`src/lib/messaging/service.ts`) est le **seul** chemin
  d'envoi : validation, calcul des segments, débit des crédits, persistance,
  appel provider, suivi de statut, déclenchement des webhooks.
- **Deux points d'entrée** appellent ce service *en interne* (pas de hop HTTP) :
  - le **dashboard** via une Server Action (`src/app/dashboard/send/actions.ts`)
  - l'**API publique** via un Route Handler mince (`src/app/api/v1/messages/route.ts`)

**Pourquoi ?** Zéro duplication ni dérive entre l'app et l'API : mêmes règles de
facturation, de logs, de conformité et de délivrabilité partout. L'API publique
reste un simple adaptateur (auth → parse → `sendMessage` → format).

## Modèle de données (Firestore)

```
accounts/{accountId}                # organisation cliente, solde de crédits, plan
  members/{userId}                  # rôles (owner, admin, member)
  api_keys/{keyId}                  # hash de clé, scope, état (phase 2)
  contacts/{contactId}              # répertoire, opt-in / STOP
  campaigns/{campaignId}            # envois groupés programmés
messages/{messageId}                # 1 doc par destinataire (cf. lib/messaging/types.ts)
webhook_endpoints/{endpointId}      # URL + secret de signature
usage/{periodId}                    # agrégats de consommation pour la facturation
```

> Note : Firestore est limité pour les agrégations/reporting à gros volume.
> Prévoir un export **BigQuery** (ou des compteurs dénormalisés) pour
> l'analytics des messages quand le volume grandit.

## API publique `/api/v1` (contrat aligné sur TopMessage)

| Méthode | Endpoint            | Description                          |
| ------- | ------------------- | ----------------------------------- |
| `POST`  | `/api/v1/messages`  | Envoyer un SMS → `201 { data: [] }` |
| `GET`   | `/api/v1/messages`  | Lister les messages → `{ data: [] }`|

- Auth : en-tête **`X-Api-Key`**.
- Corps d'envoi : `{ "data": { "from", "to": [...], "text" } }`.
- Codes : `400` invalid_request · `401` unauthorized · `402` insufficient_balance
  · `429` rate_limited · `5xx` server_error.

### Webhooks de statut

`POST` vers l'URL du client, signé `X-Sendly-Signature` (HMAC-SHA256) :

```json
{ "data": { "id": "…", "request_id": "…", "channel": "SMS", "status": "DELIVERED", "type": "STATUS" } }
```

## Conformité (à intégrer dès le départ)

- **Opt-in / consentement** et gestion du **STOP** (désinscription) — obligatoire.
- **Enregistrement des expéditeurs** : A2P 10DLC (US), sender ID selon les pays.
- Débit des crédits **atomique** (transaction) pour éviter sur/sous-facturation.

## Roadmap

1. **Phase 1 (en cours)** — Dashboard client/admin, service d'envoi, modèle de
   données, UI. *(API publique câblée en adaptateur mince.)*
2. **Phase 2** — Auth Firebase réelle, Firestore branché, clés API + rate
   limiting, Stripe Billing, file de jobs (Inngest/QStash) pour les campagnes.
3. **Phase 3** — Contacts/segments, campagnes programmées, analytics BigQuery,
   WhatsApp, numéros entrants (INBOUND).
