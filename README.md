# FootStats Africa (Project WinMax)

Plateforme football africaine — MVP Niveau 1 (Phase A de `ROADMAP.md`).

## Démarrer en local

```bash
npm install
npm run dev
```

Ouvre http://localhost:3000. Aucune base de données n'est requise pour développer : le projet tourne avec un **repository en mémoire** (`src/db/repositories/in-memory`) alimenté par le **MockFootballProvider** (`src/providers/football/mock`), dont toutes les données sont explicitement marquées `DEMO` et ne doivent jamais être confondues avec de vraies données (brief §95).

## Vérifications

```bash
npm run typecheck   # tsc --noEmit
npm run build        # build de production Next.js (vérifié ✅)
```

## Ce qui est réellement implémenté

### Phase A — Football Core
- Homepage (live, prochains matchs, résultats récents, compétitions, joueurs africains)
- Pages `/match/[slug]`, `/equipes/[slug]`, `/joueurs/[slug]`, `/competitions`, `/competitions/[slug]`, `/classement/[slug]`, `/matchs`, `/recherche`
- SEO technique : metadata dynamique, `sitemap.xml`, `robots.txt`, JSON-LD (`BreadcrumbList`, `SportsEvent`), statut `indexable/noindex/draft` par entité
- PWA foundation : `manifest.json` + service worker basique (cache du shell, point d'extension pour le push plus tard)
- Provider abstraction complète (interface + mock), Normalizer isolant tout mapping externe → interne
- Modèle multi-pays/multi-langue en place (un seul pays actif : Sénégal — `config/countries.ts`)
- Design system minimal (Badge, Card, Skeleton, EmptyState/ErrorState, FreshnessNote) et composants football (MatchCard)

### Niveau 2 — Engagement initial
- **Compte utilisateur léger** : `src/middleware.ts` pose un cookie httpOnly (`fs_uid`) au premier passage ; aucune inscription, aucun mot de passe. Le profil `User` est créé paresseusement (`services/users/current-user-service.ts`).
- **Favoris** : équipes, joueurs, compétitions. Bouton `FavoriteButton` (Server Action `toggleFavoriteAction`, fonctionne sans JS côté client) sur les pages équipe/joueur/compétition ; page `/favoris` récapitulative.
- **Personnalisation homepage** : section "Vos favoris" mettant en avant les matchs (live ou à venir) des équipes suivies.
- **Notifications (première couche)** : abstraction `NotificationChannel` (`services/notifications/`), canal `console` actif en dev, fondation Telegram découplée (`telegram-formatter.ts` + `telegram-channel.ts`, gardée derrière `ENABLE_TELEGRAM`). Page `/parametres/notifications` pour gérer les préférences (`NotificationPreference`). L'envoi réel est gardé derrière `ENABLE_NOTIFICATIONS` (false par défaut).
- **Recherche améliorée** : insensible aux accents/casse (`normalizeForSearch`), tri par pertinence (correspondance en début de nom prioritaire).
- **Fondation IA** : `services/ai/ai-assistant-service.ts`, désactivée par défaut (`ENABLE_AI_ASSISTANT`), distingue `DATA_VERIFIED` / `INFERENCE`.

## Ce qui est stub / à faire avant la production

- **Base de données** : le schéma PostgreSQL de référence est dans `src/db/schema/schema.sql`. Le choix de l'ORM (Drizzle vs Prisma) reste à trancher (voir `DECISIONS.md` D8) avant d'implémenter les vrais repositories Postgres — ils devront juste respecter les interfaces de `src/db/repositories/interfaces.ts` et `src/db/repositories/user-interfaces.ts`, aucun service n'aura à changer. Le compte utilisateur léger devra migrer d'un cookie non signé vers un cookie signé/JWT si une vraie authentification est ajoutée plus tard.
- **Icônes PWA** : `public/manifest.json` référence `public/icons/icon-192.png` et `icon-512.png`, à fournir.
- **Notifications réelles** : `ConsoleNotificationChannel` (dev) à remplacer/compléter par un vrai canal (email transactionnel, web push) ; activer `ENABLE_NOTIFICATIONS=true` une fois prêt. Le bot Telegram reste un stub tant qu'aucun `TELEGRAM_BOT_TOKEN` n'est fourni.
- **Cotes / codes promo** : architecture posée (`src/providers/odds/`, `OddsProvider`), aucun scraper branché — voir `DECISIONS.md` D10. Nécessite d'identifier le bookmaker cible avant d'écrire quoi que ce soit (structure HTML propre à chaque site, conditions d'utilisation à vérifier).
- **IA avancée, affiliation active, multi-pays actif, mobile, B2B** : Niveau 3+ (voir `ROADMAP.md`), tables déjà présentes dans `schema.sql`, non branchées.

## Fournisseur de données football réel : football-data.org

Le provider `football-data` (`src/providers/football/api-football-data/`) est branché et fonctionnel pour les compétitions du plan gratuit (WC, CL, BL1, DED, BSA, PD, FL1, ELC, PPL, EC, SA, PL). **Aucune compétition sénégalaise ou africaine n'y est disponible** — Ligue 1 Sénégal et la CAN restent donc sourcées depuis le mock provider (toujours marquées DEMO) via un `CompositeFootballProvider` qui combine les deux sans qu'aucun service n'ait à le savoir (voir `DECISIONS.md` D9).

Pour l'activer :

```bash
# .env.local (déjà créé avec la clé fournie — NE JAMAIS COMMITER CE FICHIER)
FOOTBALL_PROVIDER=football-data
FOOTBALL_API_KEY=<votre token football-data.org>
```

Points d'attention :
- **Quota** : 10 req/min sur le plan gratuit. Le client (`api-football-data/client.ts`) limite à 8 req/min avec mise en file d'attente, et cache agressivement (matchs : 60 s, classements : 10 min, compétitions : 24 h). Ne pas retirer ce cache sans revoir la stratégie d'appel.
- **Statistiques de match, compositions, minute de jeu en direct** : non fournies par cette API (champ hors périmètre ou plan supérieur requis) — l'UI affiche "Information non disponible" plutôt que d'inventer une valeur.
- **Effectifs** : récupérés à la demande, à la première visite d'une page équipe (pas de pré-chargement global, pour économiser le quota).
- Cet environnement de développement n'a pas d'accès réseau sortant vers `api.football-data.org` — l'intégration a été validée par `tsc`/`next build`, mais un test réel en local (chez vous) est nécessaire pour confirmer le comportement live.

## Structure

Voir `ARCHITECTURE.md` pour le détail complet. En bref :

```
src/
├── app/            # Routes Next.js (App Router) — pas de logique métier ici
├── components/     # UI, layout, composants football
├── domain/         # Types et enums métier, purs
├── services/       # Orchestration (football, search, ai)
├── providers/      # Adapters externes (football, ai)
├── db/             # Schéma SQL, interfaces de repository, implémentation en mémoire
├── lib/            # timezone, slug, seo, utils
└── config/         # pays, compétitions, feature flags, provider actif, navigation, seo
```

## Documents de cadrage

- `ARCHITECTURE.md` — architecture cible et justification des couches
- `PRODUCT_SPEC.md` — vision, MVP, ce qui est reporté
- `DATA_MODEL.md` — entités, relations, stratégie de synchronisation
- `ROADMAP.md` — phases A → H
- `DECISIONS.md` — décisions architecturales et compromis assumés
