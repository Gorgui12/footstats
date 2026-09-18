/**
 * Interface que TOUT fournisseur de données football doit implémenter.
 * Les types Raw* représentent la forme brute retournée par un fournisseur
 * concret AVANT normalisation — ils ne doivent jamais fuiter au-delà de
 * providers/football/*normalizer* (cf. ARCHITECTURE.md §3).
 *
 * Le mock provider ci-contre retourne déjà des `Raw*` "génériques" pour
 * rester simple ; un vrai adapter (ex. api-football) traduirait la réponse
 * spécifique du fournisseur vers ces mêmes types Raw* avant de les passer
 * au Normalizer.
 */

export interface RawTeam {
  externalId: string;
  name: string;
  shortName: string;
  countryCode: string;
  logoUrl: string | null;
  foundedYear: number | null;
}

export interface RawPlayer {
  externalId: string;
  fullName: string;
  dateOfBirth: string | null;
  nationalityCountryCode: string | null;
  position: string | null;
  currentTeamExternalId: string | null;
  photoUrl: string | null;
}

export interface RawCompetition {
  externalId: string;
  name: string;
  countryCode: string | null;
  type: "league" | "cup" | "international";
  logoUrl: string | null;
}

export interface RawMatch {
  externalId: string;
  competitionExternalId: string;
  seasonLabel: string;
  homeTeamExternalId: string;
  awayTeamExternalId: string;
  venueName: string | null;
  kickoffAtUtc: string;
  status: string; // valeur brute du fournisseur, mappée vers MatchStatus par le Normalizer
  homeScore: number | null;
  awayScore: number | null;
  minute: number | null;
  round: string | null;
  referee: string | null;
  isDemoData: boolean; // true uniquement pour le mock provider
}

export interface RawStanding {
  competitionExternalId: string;
  seasonLabel: string;
  teamExternalId: string;
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface RawEvent {
  matchExternalId: string;
  minute: number;
  type: string;
  teamExternalId: string;
  playerExternalId: string | null;
  relatedPlayerExternalId: string | null;
}

export interface RawStatistic {
  matchExternalId: string;
  teamExternalId: string;
  key: string;
  value: number;
}

export interface RawLineup {
  matchExternalId: string;
  teamExternalId: string;
  formation: string | null;
  starters: string[]; // externalId des joueurs
  substitutes: string[];
}

export interface MatchQuery {
  countryCode?: string;
  competitionExternalId?: string;
  dateFrom?: string;
  dateTo?: string;
  live?: boolean;
}

export interface TeamQuery {
  countryCode?: string;
  competitionExternalId?: string;
}

export interface PlayerQuery {
  teamExternalId?: string;
  search?: string;
}

export interface FootballProvider {
  readonly name: string;
  getMatches(params: MatchQuery): Promise<RawMatch[]>;
  getMatch(externalId: string): Promise<RawMatch | null>;
  getTeams(params: TeamQuery): Promise<RawTeam[]>;
  getTeam(externalId: string): Promise<RawTeam | null>;
  getPlayers(params: PlayerQuery): Promise<RawPlayer[]>;
  getCompetitions(): Promise<RawCompetition[]>;
  getStandings(competitionExternalId: string, seasonLabel: string): Promise<RawStanding[]>;
  getLineups(matchExternalId: string): Promise<RawLineup[]>;
  getEvents(matchExternalId: string): Promise<RawEvent[]>;
  getStatistics(matchExternalId: string): Promise<RawStatistic[]>;
}
