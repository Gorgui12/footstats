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

/**
 * ⚠️ DONNÉES DE DÉMONSTRATION (DEMO) ⚠️
 *
 * Rien ici n'est un résultat, un horaire ou une composition réels.
 * Ces fixtures existent uniquement pour développer et tester l'application
 * tant qu'aucun fournisseur de données payant n'est branché
 * (brief §95 — ne jamais simuler des données présentées comme réelles).
 *
 * `isDemoData: true` est propagé jusqu'au modèle interne (Match.dataFreshness
 * ne peut jamais valoir "fresh" pour une donnée démo — voir normalizer).
 */

export const DEMO_TEAMS: RawTeam[] = [
  { externalId: "team-sn-national", name: "Sénégal", shortName: "SEN", countryCode: "SN", logoUrl: null, foundedYear: null },
  { externalId: "team-ma-national", name: "Maroc", shortName: "MAR", countryCode: "MA", logoUrl: null, foundedYear: null },
  { externalId: "team-jaraaf", name: "AS Jaraaf", shortName: "JAR", countryCode: "SN", logoUrl: null, foundedYear: 1936 },
  { externalId: "team-teungueth", name: "Teungueth FC", shortName: "TFC", countryCode: "SN", logoUrl: null, foundedYear: 2003 },
  { externalId: "team-real-madrid", name: "Real Madrid", shortName: "RMA", countryCode: "ES", logoUrl: null, foundedYear: 1902 },
  { externalId: "team-chelsea", name: "Chelsea", shortName: "CHE", countryCode: "GB", logoUrl: null, foundedYear: 1905 },
];

export const DEMO_PLAYERS: RawPlayer[] = [
  { externalId: "player-lamine-camara", fullName: "Lamine Camara", dateOfBirth: null, nationalityCountryCode: "SN", position: "Milieu", currentTeamExternalId: null, photoUrl: null },
  { externalId: "player-nicolas-jackson", fullName: "Nicolas Jackson", dateOfBirth: null, nationalityCountryCode: "SN", position: "Attaquant", currentTeamExternalId: "team-chelsea", photoUrl: null },
];

export const DEMO_COMPETITIONS: RawCompetition[] = [
  { externalId: "comp-ligue1-sn", name: "Ligue 1 Sénégal", countryCode: "SN", type: "league", logoUrl: null },
  { externalId: "comp-can", name: "Coupe d'Afrique des Nations", countryCode: null, type: "international", logoUrl: null },
  { externalId: "comp-ucl", name: "Ligue des Champions UEFA", countryCode: null, type: "cup", logoUrl: null },
];

const now = () => new Date();
const inHours = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();

export const DEMO_MATCHES: RawMatch[] = [
  {
    externalId: "match-sn-vs-ma-demo",
    competitionExternalId: "comp-can",
    seasonLabel: "2026",
    homeTeamExternalId: "team-sn-national",
    awayTeamExternalId: "team-ma-national",
    venueName: "Stade Abdoulaye Wade (DEMO)",
    kickoffAtUtc: inHours(2),
    status: "scheduled",
    homeScore: null,
    awayScore: null,
    minute: null,
    round: "Phase de groupes",
    referee: null,
    isDemoData: true,
  },
  {
    externalId: "match-jaraaf-vs-teungueth-demo",
    competitionExternalId: "comp-ligue1-sn",
    seasonLabel: "2025/2026",
    homeTeamExternalId: "team-jaraaf",
    awayTeamExternalId: "team-teungueth",
    venueName: "Stade Iba Mar Diop (DEMO)",
    kickoffAtUtc: now().toISOString(),
    status: "live",
    homeScore: 1,
    awayScore: 0,
    minute: 63,
    round: "Journée 12",
    referee: null,
    isDemoData: true,
  },
  {
    externalId: "match-rma-vs-che-demo",
    competitionExternalId: "comp-ucl",
    seasonLabel: "2025/2026",
    homeTeamExternalId: "team-real-madrid",
    awayTeamExternalId: "team-chelsea",
    venueName: "Santiago Bernabéu (DEMO)",
    kickoffAtUtc: inHours(-26),
    status: "finished",
    homeScore: 2,
    awayScore: 2,
    minute: null,
    round: "Phase de ligue",
    referee: null,
    isDemoData: true,
  },
];

export const DEMO_STANDINGS: RawStanding[] = [
  { competitionExternalId: "comp-ligue1-sn", seasonLabel: "2025/2026", teamExternalId: "team-jaraaf", position: 1, played: 12, wins: 8, draws: 3, losses: 1, goalsFor: 20, goalsAgainst: 8, points: 27 },
  { competitionExternalId: "comp-ligue1-sn", seasonLabel: "2025/2026", teamExternalId: "team-teungueth", position: 2, played: 12, wins: 7, draws: 3, losses: 2, goalsFor: 18, goalsAgainst: 10, points: 24 },
];

export const DEMO_EVENTS: RawEvent[] = [
  { matchExternalId: "match-jaraaf-vs-teungueth-demo", minute: 41, type: "goal", teamExternalId: "team-jaraaf", playerExternalId: null, relatedPlayerExternalId: null },
];

export const DEMO_STATISTICS: RawStatistic[] = [
  { matchExternalId: "match-jaraaf-vs-teungueth-demo", teamExternalId: "team-jaraaf", key: "possession", value: 54 },
  { matchExternalId: "match-jaraaf-vs-teungueth-demo", teamExternalId: "team-teungueth", key: "possession", value: 46 },
];

export const DEMO_LINEUPS: RawLineup[] = [
  { matchExternalId: "match-jaraaf-vs-teungueth-demo", teamExternalId: "team-jaraaf", formation: "4-3-3", starters: [], substitutes: [] },
];
