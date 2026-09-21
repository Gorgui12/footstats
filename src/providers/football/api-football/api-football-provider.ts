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
import { fetchApiFootball } from "./client";
import { API_FOOTBALL_LEAGUES, type ApiFootballLeagueConfig } from "./leagues";
import {
  mapEventToRawEvent,
  mapFixtureToRawMatch,
  mapFixtureToRawTeam,
  mapLeague,
  mapLineupToRaw,
  mapSquadToRawPlayers,
  mapStandingRowToRaw,
  mapStatisticToRaw,
  mapTeamDetailToRawTeam,
  type MappedLeague,
} from "./mapper";
import type {
  ApiEvent,
  ApiFixture,
  ApiLeague,
  ApiLineupItem,
  ApiResponseEnvelope,
  ApiSquadItem,
  ApiStandingsItem,
  ApiStatisticItem,
  ApiTeamDetail,
} from "./types";

/**
 * Provider API-FOOTBALL (api-sports) — implémente FootballProvider.
 *
 * APPORT : c'est la source réelle pour les compétitions AFRICAINES (CAN
 * et championnats locaux via la liste de `leagues.ts`), que ni
 * football-data.org ni le mock ne peuvent fournir — voir DECISIONS.md D9
 * et D13. Les données retournées portent `isDemoData: false`.
 *
 * CONTRAINTES PLAN FREE (observées empiriquement, plan « Free plans do not
 * have access to this season ») :
 * - quota **100 requêtes/jour** et **10 req/min** ;
 * - la saison COURANTE est inaccessible : seul `live=all`, `date=YYYY-MM-DD`
 *   et les saisons archivées (2022-2024) répondent ; `from`/`to` seuls sont
 *   rejetés, `page` n'existe pas sur `/fixtures`, et `date` exige `season`
 *   si combiné à `league`.
 * => la synchro globale s'appuie sur `live=all` + `date=today` (matchs réels
 *     du jour, filtres aux ligues suivies), pas sur une fenêtre from/to.
 * --classements (standings) du jour : indisponibles tant que la saison
 *     courante est verrouillée sur Free (retour vide, fallback repository).
 *
 * BUDGET PAR JOUR (TTL ci-dessous) : live 30 min → 48 req, matchs du jour
 * 60 min → 24 req, méta ligues 24 h → 7 req, + la demande (classements /
 * effectifs / événements à la visite d'une page). Passe sous 100 req/j en
 * usage personnel ; au-delà, monter de plan (saison courante débloquée) ou
 * augmenter les TTL.
 */
// Volatilité :
// - scores live : 30 min (économie sur le quota quotidien Free) ;
// - matchs du jour : 60 min (suffisant pour une diffusion quotidienne).
const LIVE_TTL_MS = 30 * 60_000;
const MATCHES_TTL_MS = 60 * 60_000;
const COMPETITIONS_TTL_MS = 24 * 60 * 60_000;
const TEAM_TTL_MS = 6 * 60 * 60_000;
const SQUAD_TTL_MS = 24 * 60 * 60_000;
const STANDINGS_TTL_MS = 10 * 60_000;
const LINEUPS_TTL_MS = 15 * 60_000;
const FIXTURE_TTL_MS = 60_000;

function toUtcDateDay(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);
}

export interface ApiFootballProviderConfig {
  apiKey: string;
  /** Liste des ligues suivies (par défaut : API_FOOTBALL_LEAGUES). */
  leagues?: ApiFootballLeagueConfig[];
}

export class ApiFootballProvider implements FootballProvider {
  readonly name = "api-football";

  private readonly leagues: ApiFootballLeagueConfig[];
  private readonly trackedLeagueIds: Set<number>;

  constructor(private readonly config: ApiFootballProviderConfig) {
    this.leagues = config.leagues ?? API_FOOTBALL_LEAGUES;
    this.trackedLeagueIds = new Set(this.leagues.map((l) => l.leagueId));
  }

  // ------------------------------------------------------------------ //
  // Mapper fixtures : une réponse contient tout (pas de paramètre `page`
  // sur /fixtures — « The Page field do not exist »), on filtre ensuite
  // aux ligues suivies.
  // ------------------------------------------------------------------ //

  private async fetchFixtures(basePath: string, ttlMs: number): Promise<ApiFixture[]> {
    const envelope = await fetchApiFootball<ApiResponseEnvelope<ApiFixture[]>>(
      basePath,
      this.config.apiKey,
      ttlMs,
    );
    return envelope.response ?? [];
  }

  private leagueConfigByExternalId(externalId: string): ApiFootballLeagueConfig | undefined {
    return this.leagues.find((l) => String(l.leagueId) === externalId);
  }

  private countryCodeForLeague(externalId: string): string {
    return this.leagueConfigByExternalId(externalId)?.countryCode ?? "";
  }

  private isTrackedFixture(fixture: ApiFixture): boolean {
    return this.trackedLeagueIds.has(fixture.league.id);
  }

  // ------------------------------------------------------------------ //
  // Méta-données ligues (current season etc.)
  // ------------------------------------------------------------------ //

  private async getLeagueInfo(leagueId: number): Promise<MappedLeague | null> {
    const config = this.leagues.find((l) => l.leagueId === leagueId);
    if (!config) return null;
    const envelope = await fetchApiFootball<ApiResponseEnvelope<ApiLeague[]>>(
      `/leagues?id=${leagueId}`,
      this.config.apiKey,
      COMPETITIONS_TTL_MS,
    );
    const league = envelope.response?.[0];
    if (!league) return null;
    return mapLeague(config, league);
  }

  // ------------------------------------------------------------------ //
  // FootballProvider
  // ------------------------------------------------------------------ //

  async getMatches(params: MatchQuery): Promise<RawMatch[]> {
    let fixtures: ApiFixture[];

    if (params.live) {
      // 1 seul appel couvre tous les matchs en cours de toutes les ligues
      // (économie de quota maximale pour la section "live" de la homepage).
      fixtures = await this.fetchFixtures("/fixtures?live=all", LIVE_TTL_MS);
    } else if (params.competitionExternalId) {
      // `league`+`season` ne répond qu'aux saisons accessibles (archive sur
      // le plan Free ; saison courante verrouillée) — on ne fait pas
      // échouer l'appelant si la saison est bloquée.
      try {
        const seasonYear = (await this.getLeagueInfo(Number(params.competitionExternalId)))?.currentSeasonYear;
        if (seasonYear == null) return [];
        fixtures = await this.fetchFixtures(
          `/fixtures?league=${params.competitionExternalId}&season=${seasonYear}`,
          MATCHES_TTL_MS,
        );
      } catch {
        return [];
      }
    } else {
      // Plan Free : pas de `from`/`to` global (rejeté) ni de saison courante
      // scorable par ligue — le jour courant via `date=` fournit les matchs
      // réels (live, terminés, à venir) de toutes les ligues en 1 appel.
      fixtures = await this.fetchFixtures(`/fixtures?date=${toUtcDateDay(0)}`, MATCHES_TTL_MS);
    }

    let rawMatches = fixtures
      .filter((f) => this.isTrackedFixture(f))
      .map(mapFixtureToRawMatch);

    if (params.competitionExternalId) {
      rawMatches = rawMatches.filter((m) => m.competitionExternalId === params.competitionExternalId);
    }
    if (params.live) {
      rawMatches = rawMatches.filter((m) => m.status === "live" || m.status === "halftime");
    }
    if (params.countryCode) {
      rawMatches = rawMatches.filter((m) => this.countryCodeForLeague(m.competitionExternalId) === params.countryCode);
    }

    return rawMatches;
  }

  async getMatch(externalId: string): Promise<RawMatch | null> {
    try {
      const envelope = await fetchApiFootball<ApiResponseEnvelope<ApiFixture[]>>(
        `/fixtures?id=${externalId}`,
        this.config.apiKey,
        FIXTURE_TTL_MS,
      );
      const fixture = envelope.response?.[0];
      return fixture ? mapFixtureToRawMatch(fixture) : null;
    } catch {
      return null;
    }
  }

  async getTeams(params: TeamQuery): Promise<RawTeam[]> {
    // Dérivé des matchs (déjà en cache via getMatches — même chemin d'appel)
    // : le payload d'un fixture embarque nom/logo/id des deux équipes. Zéro
    // appel dédié pour la liste — le détail d'une équipe se fait à la
    // demande via getTeam.
    let fixtures: ApiFixture[];
    if (params.competitionExternalId) {
      try {
        const seasonYear = (await this.getLeagueInfo(Number(params.competitionExternalId)))?.currentSeasonYear;
        if (seasonYear == null) return [];
        fixtures = await this.fetchFixtures(
          `/fixtures?league=${params.competitionExternalId}&season=${seasonYear}`,
          MATCHES_TTL_MS,
        );
      } catch {
        return [];
      }
    } else {
      fixtures = await this.fetchFixtures(`/fixtures?date=${toUtcDateDay(0)}`, MATCHES_TTL_MS);
    }

    const byExternalId = new Map<string, RawTeam>();
    for (const fixture of fixtures) {
      if (!this.isTrackedFixture(fixture)) continue;
      const home = mapFixtureToRawTeam(fixture, "home");
      const away = mapFixtureToRawTeam(fixture, "away");
      byExternalId.set(home.externalId, home);
      byExternalId.set(away.externalId, away);
    }
    return [...byExternalId.values()];
  }

  async getTeam(externalId: string): Promise<RawTeam | null> {
    try {
      const envelope = await fetchApiFootball<ApiResponseEnvelope<ApiTeamDetail[]>>(
        `/teams?id=${externalId}`,
        this.config.apiKey,
        TEAM_TTL_MS,
      );
      const detail = envelope.response?.[0];
      return detail ? mapTeamDetailToRawTeam(detail) : null;
    } catch {
      return null;
    }
  }

  async getPlayers(params: PlayerQuery): Promise<RawPlayer[]> {
    if (!params.teamExternalId) return [];
    try {
      const envelope = await fetchApiFootball<ApiResponseEnvelope<ApiSquadItem[]>>(
        `/players/squads?team=${params.teamExternalId}`,
        this.config.apiKey,
        SQUAD_TTL_MS,
      );
      const squad = envelope.response?.[0];
      if (!squad) return [];
      const players = mapSquadToRawPlayers(squad, params.teamExternalId);
      if (params.search) {
        const q = params.search.toLowerCase();
        return players.filter((p) => p.fullName.toLowerCase().includes(q));
      }
      return players;
    } catch {
      return [];
    }
  }

  async getCompetitions(): Promise<RawCompetition[]> {
    const results = await Promise.all(
      this.leagues.map((l) => this.getLeagueInfo(l.leagueId).catch(() => null)),
    );
    const seen = new Set<string>();
    return results.flatMap((info) => {
      if (!info || seen.has(info.raw.externalId)) return [];
      seen.add(info.raw.externalId);
      return [info.raw];
    });
  }

  async getStandings(competitionExternalId: string, seasonLabel: string): Promise<RawStanding[]> {
    if (!competitionExternalId || !seasonLabel) return [];
    try {
      const envelope = await fetchApiFootball<ApiResponseEnvelope<ApiStandingsItem[]>>(
        `/standings?league=${competitionExternalId}&season=${seasonLabel}`,
        this.config.apiKey,
        STANDINGS_TTL_MS,
      );
      // Certaines compétitions ont plusieurs tableaux (groupes, phases) —
      // on les aplatit tous.
      return (envelope.response ?? []).flatMap((item) =>
        item.standings.flatMap((rows) =>
          rows.map((row) => mapStandingRowToRaw(row, competitionExternalId, seasonLabel)),
        ),
      );
    } catch {
      return [];
    }
  }

  async getLineups(matchExternalId: string): Promise<RawLineup[]> {
    try {
      const envelope = await fetchApiFootball<ApiResponseEnvelope<ApiLineupItem[]>>(
        `/fixtures/lineups?fixture=${matchExternalId}`,
        this.config.apiKey,
        LINEUPS_TTL_MS,
      );
      return (envelope.response ?? []).map((l) => mapLineupToRaw(l, matchExternalId));
    } catch {
      return [];
    }
  }

  async getEvents(matchExternalId: string): Promise<RawEvent[]> {
    try {
      const envelope = await fetchApiFootball<ApiResponseEnvelope<ApiEvent[]>>(
        `/fixtures/events?fixture=${matchExternalId}`,
        this.config.apiKey,
        FIXTURE_TTL_MS,
      );
      return (envelope.response ?? []).flatMap((e) => mapEventToRawEvent(e, matchExternalId) ?? []);
    } catch {
      return [];
    }
  }

  async getStatistics(matchExternalId: string): Promise<RawStatistic[]> {
    try {
      const envelope = await fetchApiFootball<ApiResponseEnvelope<ApiStatisticItem[]>>(
        `/fixtures/statistics?fixture=${matchExternalId}`,
        this.config.apiKey,
        FIXTURE_TTL_MS,
      );
      return (envelope.response ?? []).flatMap((team) => mapStatisticToRaw(team, matchExternalId));
    } catch {
      return [];
    }
  }
}