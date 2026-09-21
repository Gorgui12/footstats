# FootStats Africa (Project WinMax)

Plateforme football africaine — MVP Niveau 1 (Phase A de `ROADMAP.md`).

## Démarrer en local

```bash
npm install
npm run dev
```

Ouvre http://localhost:3000. Aucune base de données externe n'est requise : une base **SQLite locale est créée automatiquement** (`data/footstats.db`, via `node:sqlite` — Node ≥ 22.5, aucune dépendance à installer) pour persister les données synchronisées entre les redémarrages (voir « Persistance des données » plus bas). Les repositories en mémoire restent le chemin de lecture.

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

## Multi-langue et multi-pays (Niveau 4, en cours)

Toutes les routes vivent désormais sous `src/app/[locale]/` (`/fr/...`, `/en/...`). Le middleware (`src/middleware.ts`) détecte la langue (cookie `fs_locale` → `Accept-Language` → français par défaut) et redirige automatiquement `/xxx` vers `/fr/xxx` ou `/en/xxx`. Les traductions vivent dans `src/i18n/dictionaries/{fr,en}.ts` (type partagé dans `types.ts`) — pour ajouter une langue, créer un nouveau fichier dictionnaire et l'enregistrer dans `src/i18n/dictionaries/index.ts` et `src/i18n/config.ts`.

Le sélecteur de pays (header) permet de choisir le pays d'affichage (fuseau horaire des heures de match) parmi les pays `isLaunched: true` de `config/countries.ts` — actuellement Sénégal, Côte d'Ivoire, Mali. **Important** : ceci contrôle uniquement l'affichage (heures locales, sélecteur), pas la disponibilité de compétitions réelles pour ces pays — voir `DECISIONS.md` D12.

Couverture de traduction : header/footer, homepage, `/matchs`, `/match/[slug]`, `/equipes/[slug]`, `/joueurs/[slug]`, `/competitions`, `/competitions/[slug]`, `/classement`, `/classement/[slug]`, `/recherche`, `/favoris`, `/parametres/notifications`, et les pages statiques (`/a-propos`, `/mentions-legales`, `/confidentialite`, `/contact`). Les données elles-mêmes (noms d'équipes, de compétitions) proviennent du fournisseur et ne sont pas traduites (ce sont des noms propres).

## Ce qui est stub / à faire avant la production

- **Base de données** : une persistance SQLite locale (write-through + réhydratation) est en place pour les données football — voir « Persistance des données » et `DECISIONS.md` D14. Le schéma PostgreSQL de référence reste dans `src/db/schema/schema.sql` ; le choix de l'ORM (Drizzle vs Prisma, voir `DECISIONS.md` D8) sera nécessaire uniquement pour un vrai multi-instance/scale-out — les repositories devront juste respecter les interfaces de `src/db/repositories/interfaces.ts` et `src/db/repositories/user-interfaces.ts`, aucun service n'aura à changer. Le compte utilisateur léger devra migrer d'un cookie non signé vers un cookie signé/JWT si une vraie authentification est ajoutée plus tard.
- **Icônes PWA** : `public/manifest.json` référence `public/icons/icon-192.png` et `icon-512.png`, à fournir.
- **Notifications réelles** : `ConsoleNotificationChannel` (dev) à remplacer/compléter par un vrai canal (email transactionnel, web push) ; activer `ENABLE_NOTIFICATIONS=true` une fois prêt. Le bot Telegram reste un stub tant qu'aucun `TELEGRAM_BOT_TOKEN` n'est fourni.
- **Cotes / codes promo** : architecture posée (`src/providers/odds/`, `OddsProvider`, `services/affiliate/odds-service.ts`, intégration conditionnelle sur la page match), aucun scraper branché — voir `DECISIONS.md` D10. Nécessite d'identifier le bookmaker cible avant d'écrire quoi que ce soit (structure HTML propre à chaque site, conditions d'utilisation à vérifier).
- **Compétitions ouest-africaines réelles** : Côte d'Ivoire et Mali sont activés comme pays d'affichage mais n'ont aucune source de données réelle (voir `DECISIONS.md` D12) — un fournisseur complet couvrant l'Afrique de l'Ouest est en cours de recherche côté produit.
- **IA avancée, affiliation active, mobile, B2B** : Niveau 5+ (voir `ROADMAP.md`), tables déjà présentes dans `schema.sql`, non branchées.

## Fournisseur de données football : API-FOOTBALL (recommandé)

Le provider `api-football` (`src/providers/football/api-football/`) est branché sur **API-FOOTBALL** (api-sports) et c'est la source réelle qui remonte aujourd'hui le plus haut dans notre positionnement : il couvre à la fois la **CAN** et les **championnats africains locaux** (aucune autre source du projet ne les fournit — football-data.org ne couvre que les grandes compétitions, voir `DECISIONS.md` D9), et les grandes compétitions déjà mises en avant par le site (Premier League, Ligue 1, etc.). Les données retournées sont réelles (`isDemoData: false`), jamais marquées DEMO.

Pour l'activer :

```bash
# .env.local (NE JAMAIS COMMITER CE FICHIER)
FOOTBALL_PROVIDER=api-football
APIFOOTBALL_API_KEY=<votre clé API-FOOTBALL>
```

Points essentiels :

- **Configurer les ligues suivies** : la CAN est activée par défaut dans `src/providers/football/api-football/leagues.ts` (id **6** = « Africa Cup of Nations », à ne pas confondre avec l'id 1 de la Coupe du Monde). Pour ajouter Ligue 1 Sénégal, Côte d'Ivoire, Mali, etc., récupérer l'id réel de la ligue sur le [dashboard API-FOOTBALL](https://dashboard.api-football.com) (page Leagues) et ajouter une entrée — l'`id` est indispensable pour interroger fixtures/classement de cette ligue.
- **Quota (plan gratuit : 100 req/j)** : la **saison courante est verrouillée** sur Free (seules les saisons 2022-2024 répondent à `league`+`season`), `from`/`to` seuls sont rejetés et `page` n'existe pas sur `/fixtures`. Le provider s'appuie donc sur `live=all` + `date=today` (1 appel chacun, filtrés aux ligues suivies), avec des TTL alignés sur le budget (live : 30 min, matchs du jour : 60 min, compétitions : 24 h) ; classements/effectifs/événements ne sont récupérés qu'à la demande, à la visite d'une page. **Conséquence** : les classements de la saison courante restent vides sur Free. Voir `DECISIONS.md` D13.
- **Noms de compétitions** : `leagues.ts` permet de fixer un nom d'affichage par ligue pour garder des slugs stables alignés sur `config/competitions.ts`.
- **Effectifs** : récupérés à la demande (`/players/squads`) à la première visite d'une page équipe — la liste `/joueurs` est alimentée par ces effectifs (même logique que football-data).
- **Validé en local** : le comportement live et les ids de ligues (notamment CAN = 6) ont été vérifiés sur `v3.football.api-sports.io` avec la clé du `.env.local` (contraintes du plan Free ci-dessus constatées empiriquement).

## Persistance des données (SQLite)

Les données football synchronisées depuis le provider sont **persistées dans une base SQLite** (`data/footstats.db`, mode WAL, via `node:sqlite` — Node ≥ 22.5, aucune dépendance à compiler) :

- **Écriture** : write-through à chaque `upsert` des repositories (équipes, joueurs, compétitions, matchs, classements) — `src/db/sqlite.ts`.
- **Réhydratation** : au démarrage du serveur, les repositories en mémoire sont rechargés depuis la base. Les données survivent donc aux redémarrages et le site s'affiche immédiatement, même si l'API (quota) est temporairement indisponible.
- **Fraîcheur** : le `lastSyncedAt` du sync-service est persistant — après un redémarrage, tant que la dernière sync date de moins de 45 s, aucun appel réseau n'est relancé (économise le quota API).
- **Limites assumées** : les événements / statistiques / compositions / classements à la demande sont récupérés à l'instant T, non stockés ; les données utilisateur (favoris, préférences) restent en mémoire serveur. Voir `DECISIONS.md` D14.
- **Config** : variable `SQLITE_PATH` (défaut `./data/footstats.db`) ; `data/` est gitignoré. Sans `node:sqlite` (Node < 22.5) la persistance se désactive silencieusement (comportement mémoire d'origine).

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
├── db/             # Schéma SQL, interfaces de repository, persistance SQLite (sqlite.ts), implémentation en mémoire
├── lib/            # timezone, slug, seo, utils
└── config/         # pays, compétitions, feature flags, provider actif, navigation, seo
```

## Documents de cadrage

- `ARCHITECTURE.md` — architecture cible et justification des couches
- `PRODUCT_SPEC.md` — vision, MVP, ce qui est reporté
- `DATA_MODEL.md` — entités, relations, stratégie de synchronisation
- `ROADMAP.md` — phases A → H
- `DECISIONS.md` — décisions architecturales et compromis assumés
