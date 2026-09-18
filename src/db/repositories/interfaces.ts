import type { Competition, Match, Player, Standing, Team } from "@/domain/football/types";

/**
 * Interfaces stables. Les services (services/football/*) ne dépendent que
 * de ces interfaces, jamais d'une implémentation concrète — cela permet de
 * remplacer le repository en mémoire (dev) par un repository PostgreSQL
 * (production) sans toucher au reste du code (ARCHITECTURE.md §1/§4).
 */

export interface TeamRepository {
  upsert(team: Team): Promise<void>;
  findById(id: string): Promise<Team | null>;
  findBySlug(slug: string): Promise<Team | null>;
  findByCountry(countryId: string): Promise<Team[]>;
  all(): Promise<Team[]>;
}

export interface PlayerRepository {
  upsert(player: Player): Promise<void>;
  findById(id: string): Promise<Player | null>;
  findBySlug(slug: string): Promise<Player | null>;
  findByTeam(teamId: string): Promise<Player[]>;
  search(query: string): Promise<Player[]>;
}

export interface CompetitionRepository {
  upsert(competition: Competition): Promise<void>;
  findById(id: string): Promise<Competition | null>;
  findBySlug(slug: string): Promise<Competition | null>;
  all(): Promise<Competition[]>;
}

export interface MatchRepository {
  upsert(match: Match): Promise<void>;
  findById(id: string): Promise<Match | null>;
  findBySlug(slug: string): Promise<Match | null>;
  findLive(): Promise<Match[]>;
  findByCompetition(competitionId: string): Promise<Match[]>;
  findUpcoming(limit: number): Promise<Match[]>;
  findRecent(limit: number): Promise<Match[]>;
  all(): Promise<Match[]>;
}

export interface StandingRepository {
  upsertMany(standings: Standing[]): Promise<void>;
  findByCompetitionAndSeason(competitionId: string, seasonId: string): Promise<Standing[]>;
}
