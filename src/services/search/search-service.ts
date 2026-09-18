import { getAllTeams } from "@/services/football/team-service";
import { getAllCompetitions } from "@/services/football/competition-service";
import { getAllMatches } from "@/services/football/match-service";
import { repositories } from "@/db/repositories";
import type { Competition, Match, Player, Team } from "@/domain/football/types";
import { normalizeForSearch } from "@/lib/utils/normalize-search";

export interface SearchResults {
  teams: Team[];
  players: Player[];
  competitions: Competition[];
  matches: Match[];
}

/**
 * Recherche globale (contient, insensible aux accents et à la casse) sur
 * les entités déjà synchronisées, avec un tri simple par pertinence
 * (correspondance en début de nom d'abord). Conçue pour évoluer vers un
 * moteur plus intelligent (brief §26) sans changer la signature de
 * `search()`.
 */
function rankByRelevance<T>(items: T[], query: string, getLabel: (item: T) => string): T[] {
  return [...items].sort((a, b) => {
    const aStarts = normalizeForSearch(getLabel(a)).startsWith(query) ? 0 : 1;
    const bStarts = normalizeForSearch(getLabel(b)).startsWith(query) ? 0 : 1;
    return aStarts - bStarts;
  });
}

export async function search(query: string): Promise<SearchResults> {
  const q = normalizeForSearch(query);
  if (!q) return { teams: [], players: [], competitions: [], matches: [] };

  // On récupère l'ensemble des joueurs synchronisés pour leur appliquer la
  // même normalisation (accent-insensible) que les autres entités, plutôt
  // que de dépendre du filtre "contient" (sensible aux accents) du
  // repository.
  const [teams, allPlayers, competitions, matches] = await Promise.all([
    getAllTeams(),
    repositories.players.search(""),
    getAllCompetitions(),
    getAllMatches(),
  ]);

  const matchingTeams = teams.filter((t) => normalizeForSearch(t.name).includes(q));
  const matchingPlayers = allPlayers.filter((p) => normalizeForSearch(p.fullName).includes(q));
  const matchingCompetitions = competitions.filter((c) => normalizeForSearch(c.name).includes(q));
  const matchingMatches = matches.filter((m) => normalizeForSearch(m.slug.replace(/-/g, " ")).includes(q));

  return {
    teams: rankByRelevance(matchingTeams, q, (t) => t.name),
    players: rankByRelevance(matchingPlayers, q, (p) => p.fullName),
    competitions: rankByRelevance(matchingCompetitions, q, (c) => c.name),
    matches: matchingMatches,
  };
}
