import type {
  RawCompetition,
  RawEvent,
  RawMatch,
  RawPlayer,
  RawStanding,
  RawTeam,
} from "../football-provider.interface";
import type {
  FdCompetition,
  FdMatch,
  FdSquadPlayer,
  FdStandingTableRow,
  FdTeamDetail,
  FdTeamRef,
} from "./types";

/**
 * Traduit le vocabulaire de statut football-data.org vers le vocabulaire
 * partagé attendu par providers/football/normalizer.ts (mêmes valeurs que
 * le mock provider : "scheduled", "live", "finished"...). Voir
 * football-provider.interface.ts — RawMatch.status doit déjà être dans ce
 * vocabulaire commun avant de sortir du mapper d'un provider.
 */
function mapStatus(fdStatus: string): string {
  switch (fdStatus) {
    case "SCHEDULED":
    case "TIMED":
      return "scheduled";
    case "IN_PLAY":
    case "LIVE":
      return "live";
    case "PAUSED":
      return "halftime";
    case "FINISHED":
    case "AWARDED":
      return "finished";
    case "POSTPONED":
      return "postponed";
    case "SUSPENDED":
      return "postponed";
    case "CANCELLED":
      return "cancelled";
    default:
      return "scheduled";
  }
}

function teamRefToRawTeam(team: FdTeamRef, areaCode: string): RawTeam {
  return {
    externalId: String(team.id),
    name: team.name,
    shortName: team.shortName ?? team.tla ?? team.name,
    countryCode: areaCode,
    logoUrl: team.crest,
    foundedYear: null,
  };
}

export function mapTeamDetail(team: FdTeamDetail): RawTeam {
  return {
    externalId: String(team.id),
    name: team.name,
    shortName: team.shortName ?? team.tla ?? team.name,
    countryCode: team.area.code ?? team.area.name,
    logoUrl: team.crest,
    foundedYear: team.founded,
  };
}

export function mapSquadPlayer(player: FdSquadPlayer, teamExternalId: string): RawPlayer {
  return {
    externalId: String(player.id),
    fullName: player.name,
    dateOfBirth: player.dateOfBirth,
    nationalityCountryCode: player.nationality,
    position: player.position,
    currentTeamExternalId: teamExternalId,
    photoUrl: null,
  };
}

export function mapCompetition(comp: FdCompetition): RawCompetition {
  return {
    externalId: comp.code,
    name: comp.name,
    countryCode: comp.area.code,
    type: comp.type === "CUP" ? "cup" : "league",
    logoUrl: comp.emblem,
  };
}

export function mapMatch(match: FdMatch): RawMatch {
  return {
    externalId: String(match.id),
    competitionExternalId: match.competition.code,
    seasonLabel: `${new Date(match.season.startDate).getFullYear()}/${new Date(match.season.endDate).getFullYear()}`,
    homeTeamExternalId: String(match.homeTeam.id),
    awayTeamExternalId: String(match.awayTeam.id),
    venueName: match.venue ?? null,
    kickoffAtUtc: match.utcDate,
    status: mapStatus(match.status),
    homeScore: match.score.fullTime.home,
    awayScore: match.score.fullTime.away,
    // football-data.org ne fournit pas la minute de jeu sur le plan
    // gratuit — l'UI doit gérer ce cas (pas de "minute'" invalide affiché).
    minute: null,
    round: match.stage,
    referee: match.referees?.[0]?.name ?? null,
    isDemoData: false,
  };
}

export function extractTeamsFromMatches(matches: FdMatch[]): RawTeam[] {
  const byExternalId = new Map<string, RawTeam>();
  for (const match of matches) {
    if (!byExternalId.has(String(match.homeTeam.id))) {
      byExternalId.set(String(match.homeTeam.id), teamRefToRawTeam(match.homeTeam, ""));
    }
    if (!byExternalId.has(String(match.awayTeam.id))) {
      byExternalId.set(String(match.awayTeam.id), teamRefToRawTeam(match.awayTeam, ""));
    }
  }
  return [...byExternalId.values()];
}

export function mapStandingRow(row: FdStandingTableRow, competitionExternalId: string, seasonLabel: string): RawStanding {
  return {
    competitionExternalId,
    seasonLabel,
    teamExternalId: String(row.team.id),
    position: row.position,
    played: row.playedGames,
    wins: row.won,
    draws: row.draw,
    losses: row.lost,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    points: row.points,
  };
}

export function mapGoalsToEvents(match: FdMatch): RawEvent[] {
  if (!match.goals) return [];
  return match.goals.map((goal) => ({
    matchExternalId: String(match.id),
    minute: goal.minute,
    type: goal.type === "OWN" ? "own_goal" : goal.type === "PENALTY" ? "penalty_goal" : "goal",
    teamExternalId: String(goal.team.id),
    playerExternalId: goal.scorer.id !== null ? String(goal.scorer.id) : null,
    relatedPlayerExternalId: goal.assist?.id != null ? String(goal.assist.id) : null,
  }));
}
