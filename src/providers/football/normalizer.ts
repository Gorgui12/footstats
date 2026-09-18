import { CompetitionType, DataFreshness, MatchEventType, MatchStatus, SeoStatus } from "@/domain/football/enums";
import type {
  Competition,
  Match,
  MatchEvent,
  MatchStatistic,
  Player,
  Standing,
  Team,
} from "@/domain/football/types";
import { matchSlug, slugify } from "@/lib/slug";
import type {
  RawCompetition,
  RawEvent,
  RawMatch,
  RawPlayer,
  RawStanding,
  RawStatistic,
  RawTeam,
} from "./football-provider.interface";

/**
 * Le Normalizer est le SEUL endroit du code qui connaît le format d'un
 * fournisseur externe (via les types Raw*). Tout ce qui est en aval
 * (repositories, services, pages) ne manipule que le modèle interne
 * (domain/football/types.ts) — cf. ARCHITECTURE.md §3.
 *
 * Stratégie d'ID interne pour le MVP : `${providerName}:${externalId}`.
 * C'est une simplification du concept `ProviderMapping` (DATA_MODEL.md §1) —
 * suffisant tant qu'un seul provider est actif à la fois. Le jour où deux
 * fournisseurs doivent être réconciliés (ex. migration progressive), cette
 * fonction devra être remplacée par une vraie résolution via une table
 * ProviderMapping — sans changer la signature des fonctions ci-dessous.
 */

const MATCH_STATUS_MAP: Record<string, MatchStatus> = {
  scheduled: MatchStatus.SCHEDULED,
  postponed: MatchStatus.POSTPONED,
  cancelled: MatchStatus.CANCELLED,
  live: MatchStatus.LIVE,
  halftime: MatchStatus.HALFTIME,
  finished: MatchStatus.FINISHED,
  after_extra_time: MatchStatus.AFTER_EXTRA_TIME,
  after_penalties: MatchStatus.AFTER_PENALTIES,
};

const EVENT_TYPE_MAP: Record<string, MatchEventType> = {
  goal: MatchEventType.GOAL,
  own_goal: MatchEventType.OWN_GOAL,
  penalty_goal: MatchEventType.PENALTY_GOAL,
  penalty_missed: MatchEventType.PENALTY_MISSED,
  yellow_card: MatchEventType.YELLOW_CARD,
  red_card: MatchEventType.RED_CARD,
  substitution: MatchEventType.SUBSTITUTION,
  var: MatchEventType.VAR,
};

const COMPETITION_TYPE_MAP: Record<string, CompetitionType> = {
  league: CompetitionType.LEAGUE,
  cup: CompetitionType.CUP,
  international: CompetitionType.INTERNATIONAL,
};

export function internalId(providerName: string, externalId: string): string {
  return `${providerName}:${externalId}`;
}

export function normalizeTeam(providerName: string, raw: RawTeam): Team {
  return {
    id: internalId(providerName, raw.externalId),
    slug: slugify(raw.name),
    name: raw.name,
    shortName: raw.shortName,
    countryId: raw.countryCode,
    logoUrl: raw.logoUrl,
    foundedYear: raw.foundedYear,
    seoStatus: SeoStatus.INDEXABLE,
  };
}

export function normalizePlayer(providerName: string, raw: RawPlayer): Player {
  return {
    id: internalId(providerName, raw.externalId),
    slug: slugify(raw.fullName),
    fullName: raw.fullName,
    dateOfBirth: raw.dateOfBirth,
    nationalityCountryId: raw.nationalityCountryCode,
    position: raw.position,
    currentTeamId: raw.currentTeamExternalId ? internalId(providerName, raw.currentTeamExternalId) : null,
    photoUrl: raw.photoUrl,
    seoStatus: SeoStatus.INDEXABLE,
  };
}

export function normalizeCompetition(providerName: string, raw: RawCompetition): Competition {
  return {
    id: internalId(providerName, raw.externalId),
    slug: slugify(raw.name),
    name: raw.name,
    countryId: raw.countryCode,
    type: COMPETITION_TYPE_MAP[raw.type] ?? CompetitionType.LEAGUE,
    logoUrl: raw.logoUrl,
    isActive: true,
    seoStatus: SeoStatus.INDEXABLE,
  };
}

export function normalizeMatch(providerName: string, raw: RawMatch, teamNames: { home: string; away: string }): Match {
  const status = MATCH_STATUS_MAP[raw.status] ?? MatchStatus.SCHEDULED;

  // Règle non négociable (brief §95) : une donnée DEMO n'est jamais "fresh".
  const freshness = raw.isDemoData ? DataFreshness.UNAVAILABLE : DataFreshness.FRESH;

  return {
    id: internalId(providerName, raw.externalId),
    slug: matchSlug(teamNames.home, teamNames.away),
    competitionId: internalId(providerName, raw.competitionExternalId),
    seasonId: `${internalId(providerName, raw.competitionExternalId)}:${raw.seasonLabel}`,
    homeTeamId: internalId(providerName, raw.homeTeamExternalId),
    awayTeamId: internalId(providerName, raw.awayTeamExternalId),
    venueId: null,
    kickoffAtUtc: raw.kickoffAtUtc,
    status,
    homeScore: raw.homeScore,
    awayScore: raw.awayScore,
    halftimeHomeScore: null,
    halftimeAwayScore: null,
    extraTimeHomeScore: null,
    extraTimeAwayScore: null,
    penaltyHomeScore: null,
    penaltyAwayScore: null,
    round: raw.round,
    referee: raw.referee,
    minute: raw.minute,
    dataFreshness: freshness,
    lastSyncedAt: new Date().toISOString(),
    seoStatus: SeoStatus.INDEXABLE,
  };
}

export function normalizeStanding(providerName: string, raw: RawStanding): Standing {
  return {
    competitionId: internalId(providerName, raw.competitionExternalId),
    seasonId: `${internalId(providerName, raw.competitionExternalId)}:${raw.seasonLabel}`,
    teamId: internalId(providerName, raw.teamExternalId),
    position: raw.position,
    played: raw.played,
    wins: raw.wins,
    draws: raw.draws,
    losses: raw.losses,
    goalsFor: raw.goalsFor,
    goalsAgainst: raw.goalsAgainst,
    goalDifference: raw.goalsFor - raw.goalsAgainst,
    points: raw.points,
    lastSyncedAt: new Date().toISOString(),
  };
}

export function normalizeEvent(providerName: string, raw: RawEvent): MatchEvent {
  return {
    id: `${internalId(providerName, raw.matchExternalId)}:${raw.minute}:${raw.type}:${raw.teamExternalId}`,
    matchId: internalId(providerName, raw.matchExternalId),
    minute: raw.minute,
    type: EVENT_TYPE_MAP[raw.type] ?? MatchEventType.GOAL,
    teamId: internalId(providerName, raw.teamExternalId),
    playerId: raw.playerExternalId ? internalId(providerName, raw.playerExternalId) : null,
    relatedPlayerId: raw.relatedPlayerExternalId ? internalId(providerName, raw.relatedPlayerExternalId) : null,
    description: null,
  };
}

export function normalizeStatistic(providerName: string, raw: RawStatistic): MatchStatistic {
  return {
    matchId: internalId(providerName, raw.matchExternalId),
    teamId: internalId(providerName, raw.teamExternalId),
    key: raw.key,
    value: raw.value,
  };
}
