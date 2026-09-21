import { COUNTRIES } from "@/config/countries";
import type {
  RawCompetition,
  RawEvent,
  RawLineup,
  RawMatch,
  RawPlayer,
  RawStanding,
  RawStatistic,
  RawTeam,
} from "../football-provider.interface";
import type { ApiFootballLeagueConfig } from "./leagues";
import type {
  ApiEvent,
  ApiFixture,
  ApiLeague,
  ApiLineupItem,
  ApiSquadItem,
  ApiStandingRow,
  ApiStatisticItem,
  ApiTeamDetail,
} from "./types";

/**
 * Traduit les réponses API-FOOTBALL vers les types Raw* partagés attendus
 * par providers/football/normalizer.ts. Ce fichier est l'UNIQUE endroit du
 * provider qui connaît la structure de réponse d'api-football.
 */

/** Statuts courts API-FOOTBALL → vocabulaire commun des Raw* (voir
 * football-provider.interface.ts et normalizer.ts). */
export function mapFixtureStatus(short: string): string {
  switch (short) {
    case "TBD":
    case "NS":
      return "scheduled";
    case "1H":
    case "2H":
    case "ET":
    case "BT":
    case "P":
    case "SUSP":
    case "INT":
    case "LIVE":
      return "live";
    case "HT":
      return "halftime";
    case "FT":
      return "finished";
    case "AET":
      return "after_extra_time";
    case "PEN":
      return "after_penalties";
    case "PST":
      return "postponed";
    case "CANC":
    case "ABD":
    case "AWD":
    case "WO":
      return "cancelled";
    default:
      return "scheduled";
  }
}

export function mapCompetitionType(type: string): "league" | "cup" | "international" {
  switch (type.toLowerCase()) {
    case "cup":
      return "cup";
    case "league":
      return "league";
    default:
      return "international";
  }
}

/**
 * API-FOOTBALL expose le pays sous forme de NOM (ex. "England") alors que
 * notre modèle interne attend un code ISO. On re-mappe d'abord via le
 * registre config/countries.ts (noms français), puis via un petit
 * dictionnaire des noms anglais courants couvrant les pays du registre.
 */
const ENGLISH_COUNTRY_NAME_TO_CODE: Record<string, string> = {
  england: "ENG",
  spain: "ESP",
  germany: "GER",
  italy: "ITA",
  france: "FRA",
  netherlands: "NED",
  portugal: "POR",
  brazil: "BRA",
  senegal: "SN",
  "côte d'ivoire": "CI",
  "ivory coast": "CI",
  mali: "ML",
  "burkina faso": "BF",
  guinea: "GN",
  benin: "BJ",
  togo: "TG",
  nigeria: "NG",
  ghana: "GH",
  kenya: "KE",
  "south africa": "ZA",
  morocco: "MA",
  world: "WORLD",
};

export function countryNameToCode(name: string | null | undefined): string {
  if (!name) return "";
  const key = name.trim().toLowerCase();
  const fromRegistry = Object.values(COUNTRIES).find(
    (entry) => entry.name.toLowerCase() === key || entry.code.toLowerCase() === key,
  );
  if (fromRegistry) return fromRegistry.code;
  return ENGLISH_COUNTRY_NAME_TO_CODE[key] ?? ""; // inconnu → repli vide
}

export interface MappedLeague {
  raw: RawCompetition;
  currentSeasonYear: number | null;
}

export function mapLeague(config: ApiFootballLeagueConfig, league: ApiLeague): MappedLeague {
  // L'endpoint /leagues renvoie ses saisons de la plus ancienne à la plus
  // récente : sans flag `current`, la saison courante est la DERNIÈRE
  // (le `[0]` donnait la toute première, ex. 2010 pour la Premier League).
  const currentSeason =
    league.seasons.find((s) => s.current) ?? league.seasons[league.seasons.length - 1] ?? null;
  return {
    raw: {
      externalId: String(league.league.id),
      name: config.name ?? league.league.name,
      countryCode: config.countryCode !== undefined ? config.countryCode : (league.country.code ?? null),
      type: config.type ?? mapCompetitionType(league.league.type),
      logoUrl: league.league.logo ?? null,
    },
    currentSeasonYear: currentSeason?.year ?? null,
  };
}

export function mapFixtureToRawMatch(fixture: ApiFixture): RawMatch {
  return {
    externalId: String(fixture.fixture.id),
    competitionExternalId: String(fixture.league.id),
    seasonLabel: String(fixture.league.season),
    homeTeamExternalId: String(fixture.teams.home.id),
    awayTeamExternalId: String(fixture.teams.away.id),
    venueName: fixture.fixture.venue?.name ?? null,
    kickoffAtUtc: fixture.fixture.date,
    status: mapFixtureStatus(fixture.fixture.status.short),
    homeScore: fixture.goals?.home ?? null,
    awayScore: fixture.goals?.away ?? null,
    minute: fixture.fixture.status.elapsed,
    round: fixture.league.round ?? null,
    referee: null,
    isDemoData: false,
  };
}

export function mapFixtureToRawTeam(fixture: ApiFixture, side: "home" | "away"): RawTeam {
  const team = fixture.teams[side];
  return {
    externalId: String(team.id),
    name: team.name,
    shortName: team.code ?? team.name,
    countryCode: countryNameToCode(fixture.league.country),
    logoUrl: team.logo ?? null,
    foundedYear: null,
  };
}

export function mapTeamDetailToRawTeam(detail: ApiTeamDetail): RawTeam {
  return {
    externalId: String(detail.team.id),
    name: detail.team.name,
    shortName: detail.team.code ?? detail.team.name,
    countryCode: countryNameToCode(detail.team.country),
    logoUrl: detail.team.logo ?? null,
    foundedYear: detail.team.founded ?? null,
  };
}

export function mapSquadToRawPlayers(squad: ApiSquadItem, teamExternalId: string): RawPlayer[] {
  return squad.players.map((player) => ({
    externalId: String(player.id),
    fullName: player.name,
    dateOfBirth: null, // players/squads n'expose pas la date de naissance
    nationalityCountryCode: null, // ni la nationalité — à enrichir via /players si besoin
    position: player.position,
    currentTeamExternalId: teamExternalId,
    photoUrl: player.photo ?? null,
  }));
}

export function mapStandingRowToRaw(row: ApiStandingRow, competitionExternalId: string, seasonLabel: string): RawStanding {
  return {
    competitionExternalId,
    seasonLabel,
    teamExternalId: String(row.team.id),
    position: row.rank,
    played: row.all.played,
    wins: row.all.win,
    draws: row.all.draw,
    losses: row.all.lose,
    goalsFor: row.all.goals.for,
    goalsAgainst: row.all.goals.against,
    points: row.points,
  };
}

/** Types d'événements API-FOOTBALL (type + detail) → vocabulaire commun. */
export function mapEventType(type: string | null, detail: string | null): string {
  const normalized = `${type ?? ""} ${detail ?? ""}`.toLowerCase();
  if (normalized.includes("own goal")) return "own_goal";
  if (normalized.includes("penalty") && normalized.includes("missed")) return "penalty_missed";
  if (normalized.includes("penalty")) return "penalty_goal";
  if (normalized.includes("card")) return normalized.includes("red") ? "red_card" : "yellow_card";
  if (normalized.includes("subst")) return "substitution";
  if (normalized.includes("var")) return "var";
  if (normalized.includes("goal")) return "goal";
  return "goal";
}

export function mapEventToRawEvent(event: ApiEvent, matchExternalId: string): RawEvent | null {
  if (!event.team) return null;
  return {
    matchExternalId,
    minute: event.time.elapsed ?? 0,
    type: mapEventType(event.type, event.detail),
    teamExternalId: String(event.team.id),
    playerExternalId: event.player?.id != null ? String(event.player.id) : null,
    relatedPlayerExternalId: event.assist?.id != null ? String(event.assist.id) : null,
  };
}

/** Valeurs API-FOOTBALL en chaîne ("54%", "12") → nombre exploitable. */
function parseStatValue(raw: string): number {
  const parsed = Number.parseFloat(raw.replace(/[^\d.-]/g, ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function mapStatisticToRaw(item: ApiStatisticItem, matchExternalId: string): RawStatistic[] {
  if (!item.statistics) return [];
  return item.statistics.flatMap((stat) => {
    if (!stat.type || stat.value === null) return [];
    return [
      {
        matchExternalId,
        teamExternalId: String(item.team.id),
        key: stat.type,
        value: parseStatValue(stat.value),
      },
    ];
  });
}

export function mapLineupToRaw(lineup: ApiLineupItem, matchExternalId: string): RawLineup {
  return {
    matchExternalId,
    teamExternalId: String(lineup.team.id),
    formation: lineup.formation,
    starters: (lineup.startXI ?? []).map((p) => String(p.player.id)),
    substitutes: (lineup.substitutes ?? []).map((p) => String(p.player.id)),
  };
}