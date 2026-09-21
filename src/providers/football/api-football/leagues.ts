/**
 * Registre des compétitions suivies via API-FOOTBALL (api-sports).
 *
 * Par défaut, ce provider remplace à la fois football-data.org ET le
 * mock : il couvre la CAN (africaine) ainsi que les grandes compétitions
 * européennes déjà mises en avant par le site. Il n'y a donc pas de
 * doublon avec le CompositeFootballProvider tant que ce provider est
 * utilisé seul (`FOOTBALL_PROVIDER=api-football`).
 *
 * ⚠️ Identifiants de ligues : chaque compétition possède un `id` numérique
 * propre à API-FOOTBALL, à vérifier sur le dashboard (page "Leagues") :
 *   https://dashboard.api-football.com/
 * Les ids ci-dessous correspondent aux références documentées les plus
 * stables (Premier League = 39, Ligue 1 = 61, ...) et à la CAN = 6
 * (« Africa Cup of Nations », confirmé via /leagues?search=Africa).
 * Pour ajouter une compétition africaine locale (Ligue 1 Sénégal,
 * Ligue 1 Côte d'Ivoire, Mali...), récupérer l'id réel sur le dashboard
 * et décommenter/ajouter une entrée, par ex. :
 *   { leagueId: <id>, name: "Ligue 1 Sénégal", countryCode: "SN", type: "league" }
 *
 * `name` est un sur-nom d'affichage optionnel : il garantit des slugs
 * stables alignés sur `config/competitions.ts` (ex. "Coupe d'Afrique des
 * Nations" → "coupe-dafrique-des-nations"). S'il est absent, le nom
 * renvoyé par l'API est utilisé tel quel.
 */
export interface ApiFootballLeagueConfig {
  leagueId: number;
  name?: string;
  countryCode?: string | null;
  type?: "league" | "cup" | "international";
}

export const API_FOOTBALL_LEAGUES: ApiFootballLeagueConfig[] = [
  // Afrique — CAN (id 6 = « Africa Cup of Nations », confirmé sur l'API :
  // l'id 1 correspond à la Coupe du Monde et est obsolète).
  { leagueId: 6, name: "Coupe d'Afrique des Nations", countryCode: null, type: "international" },
  // À compléter avec les championnats locaux dès les ids récupérés sur le
  // dashboard (voir commentaire en tête de fichier).
  // { leagueId: <id>, name: "Ligue 1 Sénégal", countryCode: "SN", type: "league" },

  // Grandes compétitions déjà mises en avant par le site — noms alignés
  // sur config/competitions.ts pour que les slugs continuent de matcher.
  { leagueId: 2, name: "Ligue des Champions UEFA", countryCode: null, type: "cup" },
  { leagueId: 39, name: "Premier League", countryCode: "ENG", type: "league" },
  { leagueId: 61, name: "Ligue 1", countryCode: "FRA", type: "league" },
  { leagueId: 78, name: "Bundesliga", countryCode: "GER", type: "league" },
  { leagueId: 135, name: "Serie A", countryCode: "ITA", type: "league" },
  { leagueId: 140, name: "Primera Division", countryCode: "ESP", type: "league" },
];