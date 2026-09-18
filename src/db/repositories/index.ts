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

/**
 * Point d'entrée unique pour obtenir les repositories actifs — même
 * principe que config/football-provider.ts. Aujourd'hui : implémentation
 * en mémoire. Le jour où PostgreSQL est provisionné, ce fichier bascule
 * vers des repositories Postgres (implémentant les mêmes interfaces) sans
 * qu'aucun service n'ait à changer.
 */
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
  return {
    teams: new InMemoryTeamRepository(),
    players: new InMemoryPlayerRepository(),
    competitions: new InMemoryCompetitionRepository(),
    matches: new InMemoryMatchRepository(),
    standings: new InMemoryStandingRepository(),
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
