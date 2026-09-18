# DATA_MODEL.md — Project WinMax / FootStats Africa

## 1. Principe

Le système possède ses propres identifiants internes (UUID ou clé primaire séquentielle). Chaque entité provenant d'un fournisseur externe est reliée à cet ID interne via une table de mapping (`ProviderMapping`), jamais l'inverse. Le frontend, les URLs et les services ne connaissent que les IDs internes.

## 2. Entités principales (MVP)

### Country
```
id, code (ISO), name, timezone, currency, defaultLanguage
```

### City
```
id, countryId, name
```

### Language
```
id, code (ISO 639-1), name
```

### Currency
```
id, code (ISO 4217), name, symbol
```

### Competition
```
id, slug, name, countryId (nullable si international), type (league|cup|international),
logoUrl, isActive, seoStatus (indexable|noindex|draft)
```

### Season
```
id, competitionId, label (ex: "2025/2026"), startDate, endDate, isCurrent
```

### Team
```
id, slug, name, shortName, countryId, logoUrl, foundedYear (nullable), seoStatus
```

### Player
```
id, slug, fullName, dateOfBirth (nullable), nationalityCountryId, position,
currentTeamId (nullable), photoUrl (nullable, seulement si licite), seoStatus
```

### Venue
```
id, name, cityId, capacity (nullable)
```

### Match
```
id, competitionId, seasonId, homeTeamId, awayTeamId, venueId (nullable),
kickoffAtUtc, status (enum, cf. section 4), homeScore, awayScore,
halftimeHomeScore, halftimeAwayScore, extraTimeHomeScore, extraTimeAwayScore,
penaltyHomeScore, penaltyAwayScore, round (nullable), referee (nullable),
dataFreshness (fresh|stale|unavailable), lastSyncedAt, slug, seoStatus
```

### MatchEvent
```
id, matchId, minute, type (goal|yellow_card|red_card|substitution|...),
teamId, playerId (nullable), relatedPlayerId (nullable, ex: joueur remplacé),
description (nullable)
```

### MatchStatistic
```
id, matchId, teamId, key (possession|shots|shots_on_target|corners|fouls|...), value
```

### TeamStatistic
```
id, teamId, competitionId, seasonId, key, value
```

### PlayerStatistic
```
id, playerId, competitionId, seasonId, appearances, goals, assists, minutesPlayed, ...
```

### Standing
```
id, competitionId, seasonId, teamId, position, played, wins, draws, losses,
goalsFor, goalsAgainst, goalDifference, points, lastSyncedAt
```

### NewsArticle
```
id, slug, title, excerpt, content, coverImageUrl, authorName, publishedAt,
updatedAt, category, tags (array), relatedEntities (matchId/teamId/playerId/competitionId nullable), seoStatus
```

### Broadcast
```
id, matchId, countryId, channelName, source (nullable — traçabilité de la fiabilité),
confirmedAt (nullable — si null, ne pas afficher comme confirmé)
```

### User
```
id, email (nullable si compte léger), createdAt, preferredLanguage, preferredCountryId
```

### UserFavorite
```
id, userId, entityType (team|player|competition), entityId
```

### NotificationPreference
```
id, userId, matchStart (bool), goal (bool), lineup (bool), matchEnd (bool),
breakingNews (bool), favoriteEntityUpdates (bool)
```

### Provider
```
id, name, isActive, config (jsonb — clés/paramètres non sensibles)
```

### ProviderMapping
```
id, providerId, internalEntityType (team|player|match|competition|...),
internalEntityId, externalId
```

## 3. Entités préparées mais non activées au MVP

### AffiliatePartner
```
id, name, isActive, disclosureText, allowedCountries (array)
```

### AffiliateCampaign
```
id, partnerId, name, startDate, endDate, isActive
```

### AffiliateClick
```
id, campaignId, userId (nullable), countryId, clickedAt, targetUrl
```

Ces tables existent dans le schéma dès maintenant (pour éviter une migration lourde plus tard) mais aucune logique métier ne les alimente au lancement, hormis éventuellement un enregistrement de clic si un partenaire est déjà en place — à confirmer selon le contexte business réel.

## 4. Enums centralisés

```ts
enum MatchStatus {
  SCHEDULED = "scheduled",
  POSTPONED = "postponed",
  CANCELLED = "cancelled",
  LIVE = "live",
  HALFTIME = "halftime",
  FINISHED = "finished",
  AFTER_EXTRA_TIME = "after_extra_time",
  AFTER_PENALTIES = "after_penalties",
}

enum DataFreshness {
  FRESH = "fresh",
  STALE = "stale",
  UNAVAILABLE = "unavailable",
}

enum SeoStatus {
  INDEXABLE = "indexable",
  NOINDEX = "noindex",
  DRAFT = "draft",
}
```

Ces enums vivent dans `domain/football/enums.ts` (ou équivalent) et sont la seule source de vérité — jamais de chaînes de statut arbitraires dispersées dans le code.

## 5. Stratégie de synchronisation (MVP)

1. Un job planifié (cron / route handler déclenchée périodiquement) interroge le `FootballProvider` actif pour les matchs du jour et les matchs live.
2. Le `Normalizer` convertit la réponse brute en entités internes, résout les `ProviderMapping` existants ou en crée de nouveaux.
3. Les données sont upsertées en base (`Match`, `MatchEvent`, `MatchStatistic`, `Standing`).
4. `dataFreshness` et `lastSyncedAt` sont mis à jour à chaque synchronisation réussie ; en cas d'échec, les données existantes passent à `stale` après un délai défini plutôt que d'être supprimées.
5. Les pages lisent uniquement depuis la base (jamais un appel direct au provider externe au moment du rendu), pour maîtriser les coûts et la latence.

## 6. Gestion des slugs et renommages

Table `SlugRedirect` (optionnelle mais recommandée dès le MVP si le volume de contenu le justifie) :
```
id, entityType, entityId, oldSlug, newSlug, redirectedAt
```
Permet de rediriger proprement une ancienne URL SEO si un slug change (renommage d'équipe, correction d'orthographe, etc.).
