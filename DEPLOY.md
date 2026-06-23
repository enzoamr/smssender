# Déploiement & configuration

Récapitulatif des actions manuelles à faire en dehors du code. L'app tourne en
**mode démo** (données en mémoire, faux envois) tant que rien n'est configuré ;
chaque bloc ci-dessous l'active progressivement.

## 1. Variables d'environnement (Vercel → Settings → Environment Variables)

Cocher les 3 environnements (Production / Preview / Development).

### Auth & session (obligatoire pour la connexion réelle)
| Variable | Où la trouver |
|----------|---------------|
| `NEXT_PUBLIC_FIREBASE_*` (6 vars) | Firebase Console → Project settings → SDK config |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | Firebase Console → Service accounts → Generate new private key |
| `SESSION_SECRET` | `openssl rand -base64 32` |

> ⚠️ La clé de service Firebase qui a fuité dans un chat doit être **révoquée** puis régénérée.

### Twilio (obligatoire pour de vrais SMS)
| Variable | Notes |
|----------|-------|
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | Twilio Console (dashboard) |
| `TWILIO_STATUS_CALLBACK_URL` | `https://<domaine>/api/webhooks/twilio` — URL **exacte** (sert aussi à valider la signature) |
| `TWILIO_MESSAGING_SERVICE_SID` | *Optionnel* — recommandé pour l'A2P / pool d'expéditeurs |

Après ajout/modification de variables : **Redeploy**.

## 2. Firestore (Firebase Console)

L'app lit/écrit la collection `messages` via le SDK Admin (côté serveur).

- **Règles de sécurité** : déployer `firestore.rules`. Elles refusent tout accès
  client direct — c'est voulu, tout passe par le serveur.
- **Index** : déployer `firestore.indexes.json` (index composite `accountId` +
  `createdAt`). Sans lui, l'app fonctionne quand même (tri en mémoire en repli),
  mais l'index la rend performante à l'échelle.

Avec la Firebase CLI :
```bash
firebase deploy --only firestore:rules,firestore:indexes
```
(Ou copier/coller les règles dans Console → Firestore → Rules, et laisser
Firestore proposer la création de l'index au premier chargement du dashboard.)

## 3. Twilio — webhook de statut

Dans la Twilio Console, configurer le **Status Callback URL** des messages
(ou du Messaging Service) sur `TWILIO_STATUS_CALLBACK_URL`. Les changements de
statut (sent → delivered/failed) remonteront alors automatiquement au dashboard.

---

### Mode démo (aucune config)
Sans `FIREBASE_*` / `SESSION_SECRET` : connexion auto sur un compte démo, données
en mémoire. Sans `TWILIO_*` : les envois sont simulés (provider « stub »).
