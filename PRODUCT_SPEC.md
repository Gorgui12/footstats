# PRODUCT_SPEC.md — Project WinMax / FootStats Africa

## 1. Vision

Une plateforme football africaine permettant de suivre, comprendre et vivre les matchs en temps réel — football-first, pas un site de paris. Lancement au Sénégal, conçue pour évoluer vers l'Afrique de l'Ouest francophone puis anglophone.

## 2. Positionnement

FootStats Africa est présenté comme une plateforme de suivi et d'analyse football. L'affiliation (paris) est une couche de monétisation future, clairement séparée et identifiable, jamais l'identité du produit.

## 3. MVP — Niveau 1 (à livrer maintenant)

**Core football :**
- Homepage avec matchs en direct, matchs du jour, prochains matchs, compétitions populaires, actualités, joueurs africains.
- Pages match, équipe, joueur, compétition, classement.
- Recherche (équipe / joueur / compétition / match).
- Responsive mobile-first, SEO technique de base, fondation PWA.

**Architecturalement présent dès le MVP (même si peu visible côté produit) :**
- Provider abstraction (mock + interface prête pour un vrai fournisseur).
- Modèle multi-pays et multi-langue (même si un seul pays/une seule langue activés).
- Fraîcheur des données affichée pour tout ce qui est live.

## 4. Niveau 2 — à ajouter dès que cela peut être fait proprement

- Favoris (équipes, joueurs, compétitions), nécessitant un compte utilisateur minimal.
- Personnalisation basique de la homepage selon les favoris.
- Première couche de notifications (canal simple, ex. email ou in-app — pas tous les canaux).
- Assistant IA football : réponses basées uniquement sur les données structurées de la plateforme (pas d'invention de statistiques).
- Recherche améliorée.
- Fondation Telegram (bot découplé du frontend, non prioritaire si cela retarde le lancement).

## 5. Explicitement reporté (Niveau 3+)

- Comparateur de cotes, affiliate engine dynamique, A/B testing, dashboards partenaires.
- Multi-pays actif au-delà du Sénégal, multi-langue actif au-delà du français.
- Application mobile native.
- API B2B publique, widgets embarquables.
- IA avancée (résumés automatiques post-match, comparaison de joueurs, prédictions statistiques).

Ces éléments sont préparés architecturalement (tables, interfaces) mais pas développés fonctionnellement tant qu'il n'y a pas de besoin ou de traction justifiant l'investissement.

## 6. Pages et contenu — règles éditoriales

- Aucune donnée inventée : scores, compositions, blessures, statistiques, horaires, chaînes TV, citations. Si une information n'est pas disponible : "Information non disponible."
- Diffusion TV : jamais de chaîne affichée sans source fiable confirmée.
- Une page générée par données (match, équipe, joueur, compétition) n'est indexable (SEO) que si elle a un contenu suffisant ; sinon `noindex`.
- Contenu africain traité comme un axe stratégique, pas un supplément : football sénégalais, joueurs sénégalais/africains, compétitions et clubs africains ont une vraie place éditoriale, pas une reproduction de sites européens.

## 7. IA — principes non négociables

- L'IA n'invente jamais de statistique ; elle s'appuie sur les données structurées de la plateforme via des fonctions internes dédiées (`getTeam`, `getPlayer`, `getMatch`, etc.).
- Distinction explicite entre `DATA VERIFIED` (fait provenant des données) et `INFERENCE / ANALYSIS` (analyse probabiliste).
- Aucune prédiction présentée comme une certitude ; jamais de promesse de gain.

## 8. Paris / affiliation — cadre responsable

Si des fonctionnalités de paris sont activées un jour : mentions légales obligatoires, pas de ciblage mineur, pas de promesse de gain garanti, respect des restrictions géographiques et des règles partenaires. Ces fonctionnalités restent techniquement et visuellement séparées du cœur football.

## 9. Objectif business

Le produit vise à devenir un moteur d'acquisition et de rétention : visiteur → engagement (favoris, recherche) → notification → retour → monétisation future. Chaque décision produit du MVP doit servir cette boucle sans la complexifier prématurément.

## 10. Critères de succès du MVP

- Le site répond correctement aux intentions de recherche locales (ex. "Sénégal prochain match", "Ligue 1 Sénégal classement").
- Performance mobile forte (Core Web Vitals) et navigation claire sur petit écran.
- Aucune donnée affichée n'est fausse ou inventée — la confiance éditoriale est un actif du produit dès le premier jour.
- L'architecture permet, sans réécriture du cœur, d'ajouter : un pays, un fournisseur de données, un canal de notification, un fournisseur IA (cf. `DECISIONS.md`).
