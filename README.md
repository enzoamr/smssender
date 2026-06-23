# Sendly

Plateforme SaaS d'**envoi de SMS** pour les professionnels (façon TopMessage /
Twilio) : tableau de bord client & admin, API publique, facturation à l'usage.

> 🎨 UI **shadcn/ui + Tailwind v4** · ⚙️ **Next.js 16** · 🔐 **Firebase** ·
> 📩 **Twilio** · 💳 **Stripe** · ▲ **Vercel**

L'architecture détaillée (et la logique de la « surcouche » d'envoi partagée
entre le dashboard et l'API) est documentée dans [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Démarrage

```bash
npm install
cp .env.example .env.local   # optionnel : sans clés, l'app tourne en mode démo
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) — la racine redirige vers
le tableau de bord.

> **Mode démo** : tant que les variables Firebase / Twilio sont vides, l'app
> utilise un *provider stub* et un store en mémoire pré-rempli. Le dashboard
> s'affiche et l'envoi fonctionne, sans aucun compte externe.

## Structure

```
src/
  app/
    dashboard/            # espace client (vue d'ensemble, envoi, messages, …)
    admin/                # espace administration
    api/
      v1/messages/        # API publique (POST/GET) — adaptateur mince
      webhooks/twilio/    # callback de statut Twilio
  components/
    dashboard/            # sidebar, topbar, cartes, graphe, formulaire d'envoi
    ui/                   # composants shadcn/ui
  lib/
    messaging/            # types, segments, provider, store, service (surcouche)
    firebase/             # SDK client + admin
    api/                  # auth par clé + erreurs
    config.ts · nav.ts
```

## Pages disponibles

- `/dashboard` — vue d'ensemble (stats, graphe, messages récents)
- `/dashboard/send` — composer & envoyer (compteur de segments, aperçu, coût)
- `/dashboard/messages` — historique filtrable par statut
- `/dashboard/api-keys`, `/dashboard/webhooks` — démarrage API (phase 2)
- `/admin` — pilotage global (comptes, volumes, revenus)

## Scripts

```bash
npm run dev     # développement (Turbopack)
npm run build   # build de production
npm run start   # serveur de production
npm run lint    # ESLint
```

## Déploiement

Optimisé pour **Vercel**. Renseignez les variables de `.env.example` dans les
réglages du projet, puis configurez le `TWILIO_STATUS_CALLBACK_URL` et le
webhook Stripe sur l'URL de production.
