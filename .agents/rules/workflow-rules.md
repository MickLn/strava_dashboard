# Global Agent Workflow & Execution Rules

Ces règles s'appliquent systématiquement à toutes les interventions de l'agent sur l'ensemble des projets.

---

## 1. Déclenchement Automatique des Skills Spécialisés
Avant toute action ou modification de code, identifier et activer obligatoirement les compétences adaptées :

- **Design, UI & Expérience Utilisateur :**
  - Activer `design-system-consistency`, `ui-ux-pro-max`, et `frontend-design`.
  - Respecter scrupuleusement la charte graphique et les tokens existants (typographie, palette, contrastes, espacements).
  - Vérifier systématiquement la cohérence responsive (mobile et desktop).
  - Interdiction d'ajouter des bibliothèques lourdes ou de modifier drastiquement le style sans accord préalable.

- **Rédaction & Contenu Textuel (Anti-Slop IA) :**
  - Activer `anti-ai-writing`, `human-copywriter`, et `editorial-polisher`.
  - Éliminer le rythme ternaire systématique, le vocabulaire creux (*synergie, catalyseur, etc.*) et les intros/outros artificielles.
  - Viser un ton authentique, direct et humain (portfolios, README, interfaces, e-mails, retours).

- **Architecture, Nouvelles Fonctionnalités & Refactoring :**
  - Activer `brainstorming`.
  - Valider la cohérence architecturale avant d'ajouter des dépendances ou des structures complexes.

- **Résolution de Bugs & Dysfonctionnements :**
  - Activer `systematic-debugging`.
  - Isoler la cause racine avant de tenter une correction.

- **Sécurité, Données & Gestion des Secrets :**
  - Activer `security-and-hardening` et `credentials`.
  - Ne **jamais** écrire de clé API, token ou secret en clair dans le code source (toujours utiliser `.env` et vérifier le `.gitignore`).

---

## 2. Intégrité du Code & Validation Technique
- **Préservation de l'existant :** Ne jamais supprimer ni écraser de fonctionnalités sans accord explicite.
- **Validation continue :** Après toute modification de code, vérifier l'absence d'erreurs (build, types TypeScript, linter).
- **Propreté & Minimalisme :** Ne pas ajouter de complexité superflue ni de fichiers inutiles.

---

## 3. Protocole Git & Validation Humaine (Strict)
- **Commits Atomiques :** Grouper les changements par unité logique (un bug = un commit, une feature = un commit).
- **ZÉRO commit automatique :** Il est formellement interdit d'exécuter `git commit` sans l'accord préalable explicite de l'utilisateur.
- **Format de proposition :**
  1. Présenter la liste exacte des fichiers modifiés.
  2. Proposer un message de commit concis, clair et rédigé en **anglais simple** (ex: `fix: center modal on mobile screen`, `feat: add strava shoe wear indicator`).
  3. **Attendre impérativement la validation de l'utilisateur** avant de lancer la commande.
