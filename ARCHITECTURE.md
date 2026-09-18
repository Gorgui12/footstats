# ARCHITECTURE.md — Project WinMax / FootStats Africa

## 0. État actuel du repository

Audit effectué : le repository est **vide** (aucun code existant, aucune dépendance, aucune configuration). Nous partons donc d'une base propre, sans dette technique à gérer ni code legacy à migrer.

Conséquence pratique : nous pouvons choisir la structure cible directement, sans étape de transition.

## 1. Principe directeur

**Modular monolith.** Un seul déploiement Next.js, mais organisé en domaines métier isolés avec des frontières de code claires (dossiers `domain/*`, `services/*`), pour pouvoir :
- remplacer un fournisseur de données football sans toucher au frontend ;
- ajouter un pays sans dupliquer de logique ;
- extraire un domaine en service séparé plus tard si le besoin réel apparaît (jamais avant).

Pas de microservices, pas de Kubernetes, pas de websockets au lancement. Ces choix sont documentés comme des reports volontaires dans `DECISIONS.md`.

## 2. Vue d'ensemble des couches

```
Frontend (App Router, Server/Client Components)
   ↓
Application Layer (Next.js Route Handlers / Server Actions)
   ↓
Domain Services (logique métier pure, indépendante de Next.js et du provider)
   ↓
Repositories (accès DB, interface stable)
   ↓
Database (PostgreSQL) + Cache (in-memory / Redis plus tard) + Provider Adapters
```

Règle stricte : **aucune logique métier dans les composants React.** Un composant appelle un service via un appel serveur (Server Component direct ou route handler), jamais la DB ou le provider externe directement.

## 3. Provider abstraction (règle fondamentale)

```
External Provider (ex: API-Football)
       ↓
Provider Adapter (traduit la réponse brute du fournisseur)
       ↓
Normalizer (mappe vers nos IDs internes et notre modèle)
       ↓
Internal Domain Model (Match, Team, Player, Competition...)
       ↓
Repository / DB
       ↓
Domain Services → Application Layer → Frontend
```

Interface commune (`FootballProvider`) :

```ts
interface FootballProvider {
  getMatches(params: MatchQuery): Promise<RawMatch[]>;
  getMatch(providerId: string): Promise<RawMatch>;
  getTeams(params: TeamQuery): Promise<RawTeam[]>;
  getTeam(providerId: string): Promise<RawTeam>;
  getPlayers(params: PlayerQuery): Promise<RawPlayer[]>;
  getStandings(competitionId: string, season: string): Promise<RawStanding[]>;
  getLineups(matchId: string): Promise<RawLineup>;
  getEvents(matchId: string): Promise<RawEvent[]>;
  getStatistics(matchId: string): Promise<RawStatistic[]>;
}
```

Deux implémentations dès le départ :
- `MockFootballProvider` — données de démonstration explicitement marquées `DEMO`, utilisées tant qu'aucun fournisseur payant n'est branché.
- `ApiFootballProvider` (ou équivalent) — activée via variable d'environnement / feature flag, sans toucher au reste du code.

Le choix du provider concret est injecté au niveau de la configuration (`config/football-provider.ts`), jamais importé en dur dans les services ou les pages.

**Jamais** de type `ApiFootballResponse` qui fuit au-delà de l'adapter. Le `Normalizer` est le seul endroit qui connaît la structure du fournisseur externe.

## 4. Structure de dossiers cible

```
src/
├── app/                        # App Router — routes uniquement, pas de logique métier
│   ├── page.tsx
│   ├── matchs/
│   ├── equipes/
│   ├── joueurs/
│   ├── competitions/
│   ├── classement/
│   ├── actualites/
│   ├── recherche/
│   └── api/                    # Route handlers (si besoin d'API interne/B2B plus tard)
│
├── components/
│   ├── ui/                     # Design system générique (Button, Card, Badge, Tabs, Skeleton...)
│   ├── layout/                 # Header, Footer, Navigation mobile
│   ├── football/                # Composants transverses (Scoreboard, MatchCard, TeamBadge)
│   ├── match/
│   ├── team/
│   ├── player/
│   └── competition/
│
├── domain/                      # Logique métier pure, testable, sans dépendance Next.js
│   ├── football/                 # Match, Team, Player, Competition, Standing (types + règles)
│   ├── users/
│   ├── notifications/
│   ├── affiliate/                # Préparé, non branché au MVP
│   └── analytics/
│
├── services/                    # Orchestration : combine repositories + providers + cache
│   ├── football/
│   ├── search/
│   ├── notifications/
│   ├── ai/
│   ├── affiliate/
│   └── analytics/
│
├── providers/                   # Adapters vers le monde extérieur
│   ├── football/
│   │   ├── football-provider.interface.ts
│   │   ├── mock/
│   │   └── api-football/
│   └── ai/
│
├── db/
│   ├── schema/                  # Schéma PostgreSQL (Drizzle ou Prisma — à trancher, cf DECISIONS.md)
│   ├── repositories/             # Une interface par entité, implémentation DB derrière
│   └── migrations/
│
├── lib/
│   ├── seo/                      # Génération metadata, JSON-LD, sitemap helpers
│   ├── timezone/                 # Conversion UTC ↔ timezone pays, jamais de TZ en dur
│   ├── slug/                     # Génération et résolution de slugs, gestion des collisions
│   └── utils/
│
└── config/
    ├── countries.ts               # Registre des pays (code, timezone, langue, devise)
    ├── competitions.ts            # Registre des compétitions suivies
    ├── football-provider.ts       # Sélection du provider actif
    ├── feature-flags.ts
    ├── navigation.ts
    └── seo-config.ts
```

Règle : **aucun `if (country === "senegal")` dispersé.** Tout comportement dépendant du pays passe par `config/countries.ts` et un objet `Country` résolu au runtime.

## 5. Modèle de fraîcheur des données

Chaque donnée affichée porte un statut :

```ts
type DataFreshness = "fresh" | "stale" | "unavailable";
```

- Scores live : `fresh` si mis à jour il y a < N secondes (polling), sinon `stale` avec horodatage visible ("Dernière mise à jour : 20:14").
- Diffusion TV / compositions : `unavailable` explicite si la source n'a rien fourni — jamais de valeur inventée.

## 6. Temps réel (MVP vs futur)

MVP : **polling raisonnable** côté serveur (ex: revalidation ISR courte sur les pages match en direct, ou route handler interrogé à intervalle par le client). Pas de websockets, pas de pipeline d'ingestion d'événements.

Architecture cible préparée mais non construite :

```
Provider → Ingestion → Event Processing → Cache → Frontend (push/websocket)
```

Le point d'extension : le `MatchService` expose déjà une interface `getLiveMatches()` / `subscribeToMatch()` (implémentée en polling aujourd'hui) que l'on pourra réimplémenter en websocket sans changer les appelants.

## 7. Cache

- MVP : cache applicatif en mémoire + `revalidate` Next.js (ISR) sur les pages semi-statiques (équipes, compétitions, classements).
- Scores du jour / live : cache court (quelques secondes à quelques dizaines de secondes).
- Redis : ajouté seulement quand un besoin concret apparaît (plusieurs instances serveur, cache partagé nécessaire). Interface `CacheProvider` dès le départ pour permettre ce remplacement sans changer les appelants.

## 8. Internationalisation (i18n) et multi-pays

- Textes UI : centralisés via un système i18n (ex: `next-intl` ou dictionnaires JSON), même si une seule langue (français) est livrée au lancement. Aucun texte statique en dur dans les composants au-delà de la V1.
- Données pays : `Country` en base + registre `config/countries.ts` (timezone, devise, langue par défaut, compétitions locales).
- Heure : toujours stockée en UTC en base, convertie à l'affichage via `lib/timezone` selon le pays de l'utilisateur (ou son fuseau détecté).

## 9. SEO technique

- Metadata dynamique par page (Next.js `generateMetadata`).
- `sitemap.xml` généré dynamiquement à partir des entités indexables.
- Statut `indexable | noindex | draft` sur chaque page générée par données (match, équipe, joueur, compétition) — une page avec contenu insuffisant est `noindex` par défaut.
- JSON-LD (`SportsEvent`, `SportsTeam`, `Person`, `Article`, `BreadcrumbList`) uniquement quand les données réelles le permettent.
- Slugs stables, gérés par `lib/slug`, avec table de redirection en cas de renommage.

## 10. PWA

MVP : `manifest.json`, service worker basique (cache des assets statiques + shell applicatif), installabilité. Pas de push notifications au lancement, mais le service worker est structuré pour accueillir un `push` event handler plus tard sans réécriture.

## 11. Sécurité

- Aucune clé API/secret côté client. Tous les appels provider passent par le serveur (Route Handlers / Server Components).
- Variables sensibles via `.env` (jamais committées), `.env.example` fourni.
- Validation des inputs (recherche, formulaires) avec une librairie de schéma (ex: Zod) à la frontière de l'application layer.
- Rate limiting prévu sur les routes API publiques (interface prête, implémentation simple au démarrage — ex: limite en mémoire ou via un middleware léger).

## 12. Observabilité (MVP raisonnable)

- Logs structurés côté serveur.
- Un endpoint interne simple de santé (`/api/health` ou équivalent) exposant : statut provider, dernière synchronisation, statut DB/cache — pas un système de monitoring complet, juste la structure minimale pour vérifier que tout fonctionne.

## 13. Ce qui est explicitement préparé mais non construit au lancement

- Affiliation (tables prêtes, aucune logique de sélection dynamique d'offre).
- IA avancée (interface `AiAssistant` prête, implémentation minimale ou différée).
- Multi-langue au-delà du français (structure i18n en place, traductions non produites).
- Notifications push / Telegram (interface `NotificationChannel` prête, aucun canal branché sauf éventuellement email basique).
- API B2B publique (aucune route publique documentée au lancement).

Voir `DECISIONS.md` pour la justification de chaque report, et `FUTURE_ROADMAP.md` (à produire à l'étape suivante si validé) pour le séquencement.
