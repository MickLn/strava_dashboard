# 🏃 Strava Runner Dashboard ("Editorial Paper")

Tableau de bord personnel de course à pied et d'analyse de performance connecté à l'API Strava, réactif sur **Mobile & Desktop**, avec synchronisation automatique via **GitHub Actions** et hébergement gratuit sur **GitHub Pages**.

---

## ✨ Fonctionnalités

- **Esthétique "Runner Paper"** : Fond chaud et épuré, typographie élégante, sans dark mode ni néons.
- **Vue d'Ensemble & Régularité** : Total des kilomètres, nombre de runs, calories estimées, streak hebdomadaire en cours avec pastilles des jours courus (L M M J V S D).
- **Moyennes Historiques** : Sorties/semaine, temps/semaine, distance/semaine et calories/semaine.
- **Graphiques Interactifs** :
  - Évolution cumulée YTD (comparaison mois par mois).
  - Histogramme mensuel combiné (Distance vs Calories).
- **Matrice de Constance (52 Semaines)** : Grille annuelle type "GitHub Contribution" montrant l'intensité des sorties au fil de l'année.
- **Records & Best Efforts** : Top 3 sur 5 km, 10 km et Sorties Longues (15k+).
- **Parc de Chaussures (Gear Locker)** : Jauge d'usure kilométrique, pourcentage de vie restant et heures d'amorti.
- **Tracés GPS & Heatmap Interactive** : Rendu cartographique Leaflet léger et fluide de toutes vos traces.
- **Flux des Activités** : 10 dernières sorties avec allures au km, dénivelé, calories et fenêtre détaillée.

---

## 🛠️ Stack Technique

- **Frontend** : TypeScript + Vite
- **Graphiques** : Chart.js
- **Cartographie** : Leaflet.js
- **Styles** : CSS natif structuré (Tokens de Design System)
- **Automatisation** : GitHub Actions + Python 3

---

## 🚀 Démarrage Rapide en Local

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement
npm run dev

# 3. Compiler pour la production
npm run build
```

---

## 🔑 Configuration des Secrets Strava sur GitHub

Pour que votre dashboard se mette à jour **automatiquement toutes les 6 heures** sans que vous ayez à intervenir :

1. Rendez-vous sur [Strava Developers](https://www.strava.com/settings/api) et créez une application API.
2. Récupérez :
   - Votre **Client ID**
   - Votre **Client Secret**
   - Votre **Refresh Token** (avec les droits `activity:read_all`)

## 🔒 Sécurité et Protection des Secrets

1. **Aucun secret dans le code ou le dépôt Git** :
   * Le fichier `.env` est **strictement ignoré** par `.gitignore`.
   * Le code source client (`src/`) ne contient aucun secret ni token (il ne lit que `public/data/strava_data.json`).
   * Le script Python charge automatiquement `.env` en local sans rien exposer.

2. **Configuration sécurisée sur GitHub Actions** :
   * Sur votre dépôt GitHub, allez dans **Settings > Secrets and variables > Actions**
   * Ajoutez les 3 secrets suivants :
     * `STRAVA_CLIENT_ID`
     * `STRAVA_CLIENT_SECRET`
     * `STRAVA_REFRESH_TOKEN`
   * Ne partagez jamais publiquement votre `Client Secret` ou votre `Refresh Token`.

3. Activez **GitHub Pages** dans **Settings** > **Pages** (Source : *GitHub Actions*).
