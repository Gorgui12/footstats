/**
 * Modèles de réponse de l'API API-FOOTBALL (api-sports).
 * Uniquement consommés par l'adapter (client/mapper) de ce provider —
 * jamais au-delà (cf. ARCHITECTURE.md §3 : le Normalizer est le seul
 * endroit qui connaît la structure d'un fournisseur externe).
 *
 * Structurés sur la doc officielle v3 (endpoints utilisés : leagues,
 * fixtures, fixtures/events, fixtures/statistics, fixtures/lineups,
 * teams, players/squads, standings).
 */

export interface ApiResponseEnvelope<T> {
  get: string;
  parameters: Record<string, unknown>;
  errors: unknown[] | Record<string, string>;
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: T;
}

export interface ApiLeague {
  league: {
    id: number;
    name: string;
    type: string;
    logo: string | null;
  };
  country: {
    name: string;
    code: string | null;
    flag: string | null;
  };
  seasons: Array<{
    year: number;
    start: string | null;
    end: string | null;
    current: boolean;
  }>;
}

export interface ApiTeamRef {
  id: number;
  name: string;
  code: string | null;
  logo: string | null;
}

export interface ApiFixtureStatus {
  long: string;
  short: string;
  elapsed: number | null;
}

export interface ApiFixtureVenue {
  name: string | null;
  city: string | null;
}

export interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    status: ApiFixtureStatus;
    venue: ApiFixtureVenue | null;
  };
  league: {
    id: number;
    name: string;
    country: string;
    season: number;
    round: string | null;
  };
  teams: {
    home: ApiTeamRef;
    away: ApiTeamRef;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

export interface ApiTeamDetail {
  team: ApiTeamRef & {
    country: string | null;
    founded: number | null;
  };
  venue: { name: string | null; city: string | null } | null;
}

export interface ApiSquadPlayer {
  id: number;
  name: string;
  age: number | null;
  position: string | null;
  photo: string | null;
}

export interface ApiSquadItem {
  team: ApiTeamRef;
  players: ApiSquadPlayer[];
}

export interface ApiStandingRow {
  rank: number;
  team: ApiTeamRef;
  points: number;
  goalsDiff: number;
  group: string | null;
  form: string | null;
  status: string | null;
  description: string | null;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
}

export interface ApiStandingsItem {
  league: {
    id: number;
    name: string;
    season: number;
  };
  standings: ApiStandingRow[][];
}

export interface ApiEvent {
  time: {
    elapsed: number | null;
    extra: number | null;
  };
  team: ApiTeamRef | null;
  player: { id: number | null; name: string | null } | null;
  assist: { id: number | null; name: string | null } | null;
  type: string | null;
  detail: string | null;
  comments: string | null;
}

export interface ApiStatisticItem {
  team: ApiTeamRef;
  statistics: Array<{ type: string | null; value: string | null }> | null;
}

export interface ApiLineupPlayer {
  player: {
    id: number;
    name: string;
    pos: string | null;
    grid: string | null;
    number: number | null;
  };
}

export interface ApiLineupItem {
  team: ApiTeamRef;
  coach: {
    id: number | null;
    name: string | null;
    photo: string | null;
  } | null;
  formation: string | null;
  startXI: ApiLineupPlayer[] | null;
  substitutes: ApiLineupPlayer[] | null;
}