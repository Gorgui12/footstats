/**
 * Enums centralisés — source unique de vérité pour les statuts.
 * Ne jamais utiliser de chaînes arbitraires dispersées dans le code (cf. ARCHITECTURE.md §4).
 */

export enum MatchStatus {
  SCHEDULED = "scheduled",
  POSTPONED = "postponed",
  CANCELLED = "cancelled",
  LIVE = "live",
  HALFTIME = "halftime",
  FINISHED = "finished",
  AFTER_EXTRA_TIME = "after_extra_time",
  AFTER_PENALTIES = "after_penalties",
}

export const LIVE_STATUSES: ReadonlySet<MatchStatus> = new Set([
  MatchStatus.LIVE,
  MatchStatus.HALFTIME,
]);

export const FINISHED_STATUSES: ReadonlySet<MatchStatus> = new Set([
  MatchStatus.FINISHED,
  MatchStatus.AFTER_EXTRA_TIME,
  MatchStatus.AFTER_PENALTIES,
]);

export enum DataFreshness {
  FRESH = "fresh",
  STALE = "stale",
  UNAVAILABLE = "unavailable",
}

export enum SeoStatus {
  INDEXABLE = "indexable",
  NOINDEX = "noindex",
  DRAFT = "draft",
}

export enum MatchEventType {
  GOAL = "goal",
  OWN_GOAL = "own_goal",
  PENALTY_GOAL = "penalty_goal",
  PENALTY_MISSED = "penalty_missed",
  YELLOW_CARD = "yellow_card",
  RED_CARD = "red_card",
  SUBSTITUTION = "substitution",
  VAR = "var",
}

export enum CompetitionType {
  LEAGUE = "league",
  CUP = "cup",
  INTERNATIONAL = "international",
}

export enum FavoriteEntityType {
  TEAM = "team",
  PLAYER = "player",
  COMPETITION = "competition",
}
