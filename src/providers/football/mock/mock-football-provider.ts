import type {
  FootballProvider,
  MatchQuery,
  PlayerQuery,
  RawCompetition,
  RawEvent,
  RawLineup,
  RawMatch,
  RawPlayer,
  RawStanding,
  RawStatistic,
  RawTeam,
  TeamQuery,
} from "../football-provider.interface";
import {
  DEMO_COMPETITIONS,
  DEMO_EVENTS,
  DEMO_LINEUPS,
  DEMO_MATCHES,
  DEMO_PLAYERS,
  DEMO_STANDINGS,
  DEMO_STATISTICS,
  DEMO_TEAMS,
} from "./fixtures";

/**
 * Provider de démonstration. Utilisé tant qu'aucun fournisseur payant
 * (ex. API-Football) n'est configuré via FOOTBALL_PROVIDER (config/football-provider.ts).
 * Toutes les données retournées portent `isDemoData: true`.
 */
export class MockFootballProvider implements FootballProvider {
  readonly name = "mock";

  async getMatches(params: MatchQuery): Promise<RawMatch[]> {
    let matches = DEMO_MATCHES;
    if (params.competitionExternalId) {
      matches = matches.filter((m) => m.competitionExternalId === params.competitionExternalId);
    }
    if (params.live) {
      matches = matches.filter((m) => m.status === "live" || m.status === "halftime");
    }
    return matches;
  }

  async getMatch(externalId: string): Promise<RawMatch | null> {
    return DEMO_MATCHES.find((m) => m.externalId === externalId) ?? null;
  }

  async getTeams(params: TeamQuery): Promise<RawTeam[]> {
    let teams = DEMO_TEAMS;
    if (params.countryCode) {
      teams = teams.filter((t) => t.countryCode === params.countryCode);
    }
    return teams;
  }

  async getTeam(externalId: string): Promise<RawTeam | null> {
    return DEMO_TEAMS.find((t) => t.externalId === externalId) ?? null;
  }

  async getPlayers(params: PlayerQuery): Promise<RawPlayer[]> {
    let players = DEMO_PLAYERS;
    if (params.teamExternalId) {
      players = players.filter((p) => p.currentTeamExternalId === params.teamExternalId);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      players = players.filter((p) => p.fullName.toLowerCase().includes(q));
    }
    return players;
  }

  async getCompetitions(): Promise<RawCompetition[]> {
    return DEMO_COMPETITIONS;
  }

  async getStandings(competitionExternalId: string, seasonLabel: string): Promise<RawStanding[]> {
    return DEMO_STANDINGS.filter(
      (s) => s.competitionExternalId === competitionExternalId && s.seasonLabel === seasonLabel,
    );
  }

  async getLineups(matchExternalId: string): Promise<RawLineup[]> {
    return DEMO_LINEUPS.filter((l) => l.matchExternalId === matchExternalId);
  }

  async getEvents(matchExternalId: string): Promise<RawEvent[]> {
    return DEMO_EVENTS.filter((e) => e.matchExternalId === matchExternalId);
  }

  async getStatistics(matchExternalId: string): Promise<RawStatistic[]> {
    return DEMO_STATISTICS.filter((s) => s.matchExternalId === matchExternalId);
  }
}
