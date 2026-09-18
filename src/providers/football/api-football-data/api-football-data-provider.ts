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
import { fetchFootballData } from "./client";
import {
  extractTeamsFromMatches,
  mapCompetition,
  mapGoalsToEvents,
  mapMatch,
  mapSquadPlayer,
  mapStandingRow,
  mapTeamDetail,
} from "./mapper";
import type {
  FdCompetitionsResponse,
  FdMatch,
  FdMatchesResponse,
  FdStandingsResponse,
  FdTeamDetail,
} from "./types";

/**
 * Compétitions disponibles sur le compte football-data.org configuré
 * (plan Free). À mettre à jour si le plan change. Aucune compétition
 * sénégalaise/africaine n'est disponible sur ce plan — voir
 * CompositeFootballProvider et DECISIONS.md pour comment ce manque est
 * comblé sans présenter de fausses données comme réelles.
 */
export const FOOTBALL_DATA_FREE_COMPETITION_CODES = [
  "WC", "CL", "BL1", "DED", "BSA", "PD", "FL1", "ELC", "PPL", "EC", "SA", "PL",
] as const;

const MATCHES_TTL_MS = 60_000; // scores en direct : cache court
const COMPETITIONS_TTL_MS = 24 * 60 * 60_000; // change quasiment jamais
const STANDINGS_TTL_MS = 10 * 60_000; // évolue lentement
const TEAM_DETAIL_TTL_MS = 6 * 60 * 60_000;

export interface ApiFootballDataProviderConfig {
  apiKey: string;
}

export class ApiFootballDataProvider implements FootballProvider {
  readonly name = "football-data";

  constructor(private readonly config: ApiFootballDataProviderConfig) {}

  // Plan Free : l'écart entre dateFrom et dateTo ne doit pas dépasser 10
  // jours (sinon le serveur répond 400). On garde une marge (9 jours).
  private static readonly MAX_DATE_SPAN_DAYS = 9;

  private static clampDateWindow(dateFrom: string, dateTo: string): { dateFrom: string; dateTo: string } {
    const from = new Date(`${dateFrom}T00:00:00Z`).getTime();
    const to = new Date(`${dateTo}T00:00:00Z`).getTime();
    if (to - from <= ApiFootballDataProvider.MAX_DATE_SPAN_DAYS * 86_400_000) {
      return { dateFrom, dateTo };
    }
    const clamped = new Date(from + ApiFootballDataProvider.MAX_DATE_SPAN_DAYS * 86_400_000);
    return { dateFrom, dateTo: clamped.toISOString().slice(0, 10) };
  }

  private async fetchMatches(params: MatchQuery): Promise<FdMatch[]> {
    // Un seul appel couvre toutes les compétitions souscrites — bien plus
    // économe en quota que d'interroger chaque compétition séparément.
    const dateFrom = params.dateFrom ?? new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);
    const dateTo = params.dateTo ?? new Date(Date.now() + 6 * 86_400_000).toISOString().slice(0, 10);
    const { dateFrom: from, dateTo: to } = ApiFootballDataProvider.clampDateWindow(dateFrom, dateTo);
    const path = `/matches?dateFrom=${from}&dateTo=${to}`;
    const response = await fetchFootballData<FdMatchesResponse>(path, this.config.apiKey, MATCHES_TTL_MS);
    return response.matches;
  }

  async getMatches(params: MatchQuery): Promise<RawMatch[]> {
    const fdMatches = await this.fetchMatches(params);
    let matches = fdMatches.map(mapMatch);
    if (params.competitionExternalId) {
      matches = matches.filter((m) => m.competitionExternalId === params.competitionExternalId);
    }
    if (params.live) {
      matches = matches.filter((m) => m.status === "live" || m.status === "halftime");
    }
    return matches;
  }

  async getMatch(externalId: string): Promise<RawMatch | null> {
    const match = await this.getMatchRaw(externalId);
    return match ? mapMatch(match) : null;
  }

  async getTeams(params: TeamQuery): Promise<RawTeam[]> {
    // Dérivé des matchs déjà en cache plutôt que d'un appel dédié par
    // équipe : le payload d'un match embarque déjà nom/logo/id.
    const fdMatches = await this.fetchMatches({});
    let teams = extractTeamsFromMatches(fdMatches);
    if (params.competitionExternalId) {
      const relevantIds = new Set(
        fdMatches
          .filter((m) => m.competition.code === params.competitionExternalId)
          .flatMap((m) => [String(m.homeTeam.id), String(m.awayTeam.id)]),
      );
      teams = teams.filter((t) => relevantIds.has(t.externalId));
    }
    return teams;
  }

  async getTeam(externalId: string): Promise<RawTeam | null> {
    try {
      const team = await fetchFootballData<FdTeamDetail>(`/teams/${externalId}`, this.config.apiKey, TEAM_DETAIL_TTL_MS);
      return mapTeamDetail(team);
    } catch {
      return null;
    }
  }

  async getPlayers(params: PlayerQuery): Promise<RawPlayer[]> {
    if (!params.teamExternalId) return [];
    try {
      const team = await fetchFootballData<FdTeamDetail>(
        `/teams/${params.teamExternalId}`,
        this.config.apiKey,
        TEAM_DETAIL_TTL_MS,
      );
      const squad = team.squad ?? [];
      const players = squad.map((p) => mapSquadPlayer(p, params.teamExternalId!));
      if (params.search) {
        const q = params.search.toLowerCase();
        return players.filter((p) => p.fullName.toLowerCase().includes(q));
      }
      return players;
    } catch {
      // Le détail d'effectif ("squad") peut être indisponible selon le
      // plan — on renvoie une liste vide plutôt que de faire échouer la
      // page (brief §52 — toujours prévoir l'état "vide").
      return [];
    }
  }

  async getCompetitions(): Promise<RawCompetition[]> {
    const response = await fetchFootballData<FdCompetitionsResponse>(
      "/competitions/",
      this.config.apiKey,
      COMPETITIONS_TTL_MS,
    );
    return response.competitions
      .filter((c) => (FOOTBALL_DATA_FREE_COMPETITION_CODES as readonly string[]).includes(c.code))
      .map(mapCompetition);
  }

  async getStandings(competitionExternalId: string, seasonLabel: string): Promise<RawStanding[]> {
    try {
      const response = await fetchFootballData<FdStandingsResponse>(
        `/competitions/${competitionExternalId}/standings`,
        this.config.apiKey,
        STANDINGS_TTL_MS,
      );
      const totalTable = response.standings.find((s) => s.type === "TOTAL")?.table ?? response.standings[0]?.table ?? [];
      return totalTable.map((row) => mapStandingRow(row, competitionExternalId, seasonLabel));
    } catch {
      return [];
    }
  }

  async getLineups(_matchExternalId: string): Promise<RawLineup[]> {
    // Non disponible sur le plan Free football-data.org — architecture
    // prête (brief §21), simplement pas de données tant qu'un fournisseur
    // ou un plan supérieur ne les expose pas.
    return [];
  }

  async getEvents(matchExternalId: string): Promise<RawEvent[]> {
    const match = await this.getMatchRaw(matchExternalId);
    return match ? mapGoalsToEvents(match) : [];
  }

  async getStatistics(_matchExternalId: string): Promise<RawStatistic[]> {
    // football-data.org ne fournit pas de statistiques de match
    // (possession, tirs...) — champ hors périmètre de cette API.
    return [];
  }

  private async getMatchRaw(externalId: string): Promise<FdMatch | null> {
    try {
      return await fetchFootballData<FdMatch>(`/matches/${externalId}`, this.config.apiKey, MATCHES_TTL_MS);
    } catch {
      return null;
    }
  }
}
