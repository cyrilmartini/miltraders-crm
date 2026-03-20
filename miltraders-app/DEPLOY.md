# MILTRADERS — Guide de Déploiement Railway

## Étape 1 — Préparer GitHub

1. Va sur github.com → New repository → Nomme-le `miltraders-app`
2. Sur ton ordinateur, ouvre un terminal dans le dossier `miltraders-app` :

```bash
git init
git add .
git commit -m "Initial commit — MILTRADERS dashboard"
git remote add origin https://github.com/TON_USERNAME/miltraders-app.git
git push -u origin main
```

---

## Étape 2 — Créer le projet Railway

1. Va sur railway.app → New Project → Deploy from GitHub repo
2. Sélectionne `miltraders-app`

---

## Étape 3 — Ajouter PostgreSQL

Dans Railway :
1. Clique sur **+ New** → **Database** → **PostgreSQL**
2. Railway crée automatiquement la variable `DATABASE_URL`

---

## Étape 4 — Déployer le Backend

Dans Railway :
1. Clique sur **+ New** → **GitHub Repo** → sélectionne `miltraders-app`
2. Root Directory → `/backend`
3. Ajoute ces variables d'environnement :

```
VOLUMETRICA_API_KEY    = ta_clé_api_volumetrica
VOLUMETRICA_API_URL    = https://dxfeed.volumetricatrading.com
JWT_SECRET             = un_string_aléatoire_long_et_unique
NODE_ENV               = production
DATABASE_URL           = (copie depuis le service PostgreSQL Railway)
FRONTEND_URL           = https://ton-frontend.railway.app  (à remplir après étape 5)
```

4. Railway déploie → note l'URL du backend (ex: `https://miltraders-backend.railway.app`)

---

## Étape 5 — Déployer le Frontend

Dans Railway :
1. Clique sur **+ New** → **GitHub Repo** → `miltraders-app`
2. Root Directory → `/frontend`
3. Ajoute cette variable :

```
VITE_API_URL = https://miltraders-backend.railway.app/api
```

4. Railway déploie → note l'URL du frontend
5. Retourne sur le backend → mets à jour `FRONTEND_URL` avec cette URL

---

## Étape 6 — Configurer le Webhook Volumetrica

Dans l'Admin Dashboard Volumetrica :
1. Va dans **Webhooks** → **Add Webhook**
2. URL : `https://miltraders-backend.railway.app/api/webhook/volumetrica`
3. Active les catégories : **Accounts** (0) et **Trade Report** (3)
4. Sauvegarde

Dès ce moment, tout changement de statut de compte remonte automatiquement dans ton dashboard.

---

## Étape 7 — Premier Login

1. Va sur l'URL du frontend
2. Login : `admin@miltraders.com`
3. Password : choisis n'importe quel mot de passe → il sera défini au premier login
4. Le dashboard se connecte à Volumetrica et sync automatiquement

---

## Architecture finale

```
Volumetrica API
    ↓ webhooks (temps réel)
    ↓ REST polling (toutes les 5 min)
Backend Node.js (Railway)
    ↓ stocke dans
PostgreSQL (Railway)
    ↓ sert via API REST
Frontend React (Railway)
    ↓ accessible à
admin@miltraders.com (toi)
```

---

## En cas de problème

- Logs backend : Railway → ton service backend → **Logs**
- Forcer un sync manuel : appelle `POST /api/accounts/sync` avec ton token JWT
- Vérifier la DB : Railway → PostgreSQL → **Query**
