import type {
  CompetitionType,
  DataFreshness,
  MatchEventType,
  MatchStatus,
  SeoStatus,
} from "./enums";

/**
 * Modèle interne (post-normalisation). Aucune de ces interfaces ne doit
 * refléter la structure d'un fournisseur externe — voir providers/football.
 */

export interface Country {
  id: string;
  code: string; // ISO 3166-1 alpha-2, ex: "SN"
  name: string;
  timezone: string; // IANA, ex: "Africa/Dakar"
  currency: string; // ISO 4217, ex: "XOF"
  defaultLanguage: string; // ISO 639-1, ex: "fr"
}

export interface Competition {
  id: string;
  slug: string;
  name: string;
  countryId: string | null;
  type: CompetitionType;
  logoUrl: string | null;
  isActive: boolean;
  seoStatus: SeoStatus;
}

export interface Season {
  id: string;
  competitionId: string;
  label: string; // ex: "2025/2026"
  startDate: string; // ISO date
  endDate: string; // ISO date
  isCurrent: boolean;
}

export interface Team {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  countryId: string;
  logoUrl: string | null;
  foundedYear: number | null;
  seoStatus: SeoStatus;
}

export interface Player {
  id: string;
  slug: string;
  fullName: string;
  dateOfBirth: string | null;
  nationalityCountryId: string | null;
  position: string | null;
  currentTeamId: string | null;
  photoUrl: string | null;
  seoStatus: SeoStatus;
}

export interface Venue {
  id: string;
  name: string;
  cityName: string | null;
  capacity: number | null;
}

export interface Match {
  id: string;
  slug: string;
  competitionId: string;
  seasonId: string;
  homeTeamId: string;
  awayTeamId: string;
  venueId: string | null;
  kickoffAtUtc: string; // ISO datetime en UTC — jamais de TZ locale stockée
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  halftimeHomeScore: number | null;
  halftimeAwayScore: number | null;
  extraTimeHomeScore: number | null;
  extraTimeAwayScore: number | null;
  penaltyHomeScore: number | null;
  penaltyAwayScore: number | null;
  round: string | null;
  referee: string | null;
  minute: number | null; // pertinent seulement si live/halftime
  dataFreshness: DataFreshness;
  lastSyncedAt: string; // ISO datetime
  seoStatus: SeoStatus;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  minute: number;
  type: MatchEventType;
  teamId: string;
  playerId: string | null;
  relatedPlayerId: string | null;
  description: string | null;
}

export interface MatchStatistic {
  matchId: string;
  teamId: string;
  key: string; // ex: "possession", "shots", "shots_on_target", "corners", "fouls"
  value: number;
}

export interface Standing {
  competitionId: string;
  seasonId: string;
  teamId: string;
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  lastSyncedAt: string;
}

export interface Broadcast {
  matchId: string;
  countryId: string;
  channelName: string | null; // null => afficher "Information non disponible"
  confirmedAt: string | null; // null => ne jamais afficher comme confirmé
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  authorName: string;
  publishedAt: string;
  updatedAt: string;
  category: string;
  tags: string[];
  relatedEntities: {
    matchId?: string;
    teamId?: string;
    playerId?: string;
    competitionId?: string;
  };
  seoStatus: SeoStatus;
}

/** Enveloppe générique utilisée partout où une donnée peut être absente ou périmée. */
export interface WithFreshness<T> {
  data: T;
  freshness: DataFreshness;
  lastSyncedAt: string;
}
