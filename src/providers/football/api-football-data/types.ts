/**
 * Types minimaux reflétant les réponses football-data.org v4 réellement
 * consommées par l'adapter. Volontairement partiels — on ne type que ce
 * qu'on lit. Ces types ne doivent jamais fuiter au-delà de ce dossier
 * (mapper.ts les convertit en Raw* génériques — ARCHITECTURE.md §3).
 */

export interface FdArea {
  id: number;
  name: string;
  code: string | null;
  flag: string | null;
}

export interface FdTeamRef {
  id: number;
  name: string;
  shortName: string | null;
  tla: string | null;
  crest: string | null;
}

export interface FdCompetition {
  id: number;
  code: string; // ex: "PL", "CL"
  name: string;
  type: string; // "LEAGUE" | "CUP"
  area: FdArea;
  emblem: string | null;
}

export interface FdScore {
  winner: string | null;
  duration: string;
  fullTime: { home: number | null; away: number | null };
  halfTime: { home: number | null; away: number | null };
}

export interface FdMatch {
  id: number;
  competition: { id: number; code: string; name: string };
  season: { id: number; startDate: string; endDate: string };
  utcDate: string;
  status: string; // SCHEDULED | TIMED | LIVE | IN_PLAY | PAUSED | FINISHED | POSTPONED | SUSPENDED | CANCELLED | AWARDED
  matchday: number | null;
  stage: string | null;
  venue?: string | null;
  homeTeam: FdTeamRef;
  awayTeam: FdTeamRef;
  score: FdScore;
  referees?: { name: string; type: string }[];
  goals?: {
    minute: number;
    team: { id: number };
    scorer: { id: number | null; name: string | null };
    assist?: { id: number | null; name: string | null } | null;
    type: string; // REGULAR | OWN | PENALTY
  }[];
  bookings?: { minute: number; team: { id: number }; player: { id: number; name: string }; card: string }[];
}

export interface FdMatchesResponse {
  matches: FdMatch[];
}

export interface FdCompetitionsResponse {
  competitions: FdCompetition[];
}

export interface FdStandingTableRow {
  position: number;
  team: FdTeamRef;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface FdStandingsResponse {
  competition: { id: number; code: string; name: string };
  season: { id: number; startDate: string; endDate: string };
  standings: { type: string; group: string | null; table: FdStandingTableRow[] }[];
}

export interface FdSquadPlayer {
  id: number;
  name: string;
  position: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
}

export interface FdTeamDetail extends FdTeamRef {
  area: FdArea;
  founded: number | null;
  squad?: FdSquadPlayer[];
}
