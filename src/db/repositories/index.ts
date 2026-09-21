import {
  InMemoryCompetitionRepository,
  InMemoryMatchRepository,
  InMemoryPlayerRepository,
  InMemoryStandingRepository,
  InMemoryTeamRepository,
} from "./in-memory/in-memory-repositories";
import {
  InMemoryFavoriteRepository,
  InMemoryNotificationPreferenceRepository,
  InMemoryUserRepository,
} from "./in-memory/in-memory-user-repositories";
import { loadEntities, persistEntity, type EntityKind } from "@/db/sqlite";
import type { Competition, Match, Player, Standing, Team } from "@/domain/football/types";

/**
 * Point d'entrée unique pour obtenir les repositories actifs — même
 * principe que config/football-provider.ts.
 *
 * Les repositories football (teams/players/competitions/matches/standings)
 * restent la source de lecture en mémoire, mais écrivent en write-through
 * dans SQLite (src/db/sqlite.ts) et sont réhydratés au démarrage : les
 * données survivent aux redémarrages et les pages s'affichent sans
 * re-synchronisation immédiate de l'API (voir DECISIONS.md D14).
 *
 * Les repositories utilisateur (users/favorites/preferences) ne sont pas
 * persistés — ce sont des données locales au serveur, hors scope API.
 */

function persist(kind: EntityKind) {
  return (id: string, payload: unknown): void => persistEntity(kind, id, payload);
}

const globalForRepos = globalThis as unknown as {
  __footstatsRepos?: {
    teams: InMemoryTeamRepository;
    players: InMemoryPlayerRepository;
    competitions: InMemoryCompetitionRepository;
    matches: InMemoryMatchRepository;
    standings: InMemoryStandingRepository;
    users: InMemoryUserRepository;
    favorites: InMemoryFavoriteRepository;
    notificationPreferences: InMemoryNotificationPreferenceRepository;
  };
};

function createRepositories() {
  const teams = new InMemoryTeamRepository(persist("teams"));
  const players = new InMemoryPlayerRepository(persist("players"));
  const competitions = new InMemoryCompetitionRepository(persist("competitions"));
  const matches = new InMemoryMatchRepository(persist("matches"));
  const standings = new InMemoryStandingRepository(persist("standings"));

  // Réhydratation depuis la base SQLite : les données synchronisées à la
  // session précédente sont disponibles immédiatement, même avant le
  // premier appel à l'API (utile aussi quand le quota est atteint).
  teams.seed(loadEntities<Team>("teams"));
  players.seed(loadEntities<Player>("players"));
  competitions.seed(loadEntities<Competition>("competitions"));
  matches.seed(loadEntities<Match>("matches"));
  standings.seed(loadEntities<Standing>("standings"));

  return {
    teams,
    players,
    competitions,
    matches,
    standings,
    users: new InMemoryUserRepository(),
    favorites: new InMemoryFavoriteRepository(),
    notificationPreferences: new InMemoryNotificationPreferenceRepository(),
  };
}

// Réutilise l'instance entre les hot-reloads Next.js en dev (comme on le
// ferait pour un client Postgres) pour éviter de perdre les données
// synchronisées à chaque recompilation.
export const repositories = globalForRepos.__footstatsRepos ?? createRepositories();
globalForRepos.__footstatsRepos = repositories;