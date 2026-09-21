# ROADMAP.md — Project WinMax / FootStats Africa

## Phase A — Football Core (MVP, Niveau 1)
- Configuration projet (Next.js, TypeScript, Tailwind, PostgreSQL).
- Schéma DB des entités core (Country, Competition, Team, Player, Match, Standing...).
- Provider abstraction + Mock provider (données DEMO explicites).
- Normalizer et repositories.
- Homepage, pages match/équipe/joueur/compétition/classement, recherche.
- SEO technique de base, PWA foundation (manifest + service worker basique).
- Responsive mobile-first.

## Phase B — Engagement initial (Niveau 2, partiel)
- Comptes utilisateurs légers.
- Favoris (équipes, joueurs, compétitions).
- Personnalisation basique de la homepage.
- Première couche de notifications (un canal simple).
- Recherche améliorée.

## Phase C — IA
- `AiAssistant` avec accès aux données structurées uniquement (pas d'invention).
- Distinction `DATA VERIFIED` / `INFERENCE`.
- Résumés post-match, comparaison de joueurs (si données statistiques suffisantes disponibles).

## Phase D — Community
- Bot Telegram découplé du frontend.
- Partage social optimisé (WhatsApp, X, Facebook) sur les pages match.

## Phase E — Affiliation
- Activation progressive des tables déjà présentes (`AffiliatePartner`, `AffiliateCampaign`, `AffiliateClick`).
- Disclosure, pages légales, restrictions géographiques.
- Reste strictement séparée du cœur football (visuellement et techniquement).

## Phase F — Multi-pays / Multi-langue (EN COURS)
- [x] Routage multi-langue réel (`/fr`, `/en`) avec dictionnaire de traduction, sélecteur de langue, hreflang SEO.
- [x] Côte d'Ivoire et Mali activés comme préférences d'affichage (fuseau horaire, sélecteur de pays) — sans données de compétitions réelles pour ces pays (voir DECISIONS.md D12).
- [ ] Burkina Faso, Guinée, Bénin, Togo (même traitement).
- [ ] Portugais (nouveau fichier dictionnaire, cf. `src/i18n/dictionaries/`).
- [ ] Extension vers l'Afrique anglophone (Nigeria, Ghana, Kenya, Afrique du Sud) — l'anglais est déjà prêt côté i18n, il manque les pays + une source de données.
- [ ] Un fournisseur de données couvrant réellement les compétitions ouest-africaines (recherche en cours côté produit, en plus de football-data.org qui ne couvre que l'Europe/international).

## Phase G — Mobile
- Application native réutilisant les services métier existants (aucune duplication de logique).

## Phase H — B2B / Data
- API publique documentée, widgets embarquables, services pour médias tiers.

## Règle de séquencement

Aucune phase n'est démarrée avant que la précédente soit stable en production. Chaque phase doit pouvoir s'appuyer sur les abstractions déjà posées en Phase A (provider, repositories, config centralisée) sans réécriture du cœur — c'est le test de validation de l'architecture à chaque étape.
