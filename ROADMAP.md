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

## Phase F — Multi-pays / Multi-langue
- Activation de pays supplémentaires (Côte d'Ivoire, Mali, Burkina Faso, Guinée, Bénin, Togo) via `config/countries.ts`.
- Ajout de langues (anglais, portugais) via le système i18n déjà en place.
- Extension vers l'Afrique anglophone (Nigeria, Ghana, Kenya, Afrique du Sud).

## Phase G — Mobile
- Application native réutilisant les services métier existants (aucune duplication de logique).

## Phase H — B2B / Data
- API publique documentée, widgets embarquables, services pour médias tiers.

## Règle de séquencement

Aucune phase n'est démarrée avant que la précédente soit stable en production. Chaque phase doit pouvoir s'appuyer sur les abstractions déjà posées en Phase A (provider, repositories, config centralisée) sans réécriture du cœur — c'est le test de validation de l'architecture à chaque étape.
