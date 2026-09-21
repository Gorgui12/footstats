import { getFootballProvider } from "@/config/football-provider";
import { repositories } from "@/db/repositories";
import { getLastSyncedAt, setLastSyncedAt } from "@/db/sqlite";
import {
  normalizeCompetition,
  normalizeMatch,
  normalizePlayer,
  normalizeTeam,
} from "@/providers/football/normalizer";

/**
 * Orchestration : interroge le provider actif, normalise, upsert en
 * repository. Reflète le flux décrit dans DATA_MODEL.md §5.
 *
 * Resynchronise au maximum une fois toutes les SYNC_INTERVAL_MS —
 * important avec un fournisseur à quota (football-data.org : 10 req/min
 * en gratuit) : `ensureSynced` peut être appelé par plusieurs requêtes de
 * page en parallèle, on ne veut ni le faire à chaque requête, ni jamais
 * une seconde fois. Les classements ne sont volontairement PAS
 * synchronisés ici : ils sont récupérés à la demande, par compétition,
 * dans services/football/competition-service.ts — les récupérer pour
 * chaque match ici créait une rafale d'appels à chaque synchronisation
 * (jusqu'à une dizaine de compétitions distinctes d'un coup).
 */
const SYNC_INTERVAL_MS = 45_000;
// L'horodatage de la dernière sync est persisté en SQLite : après un
// redémarrage du serveur, on évite de re-frapper le provider (à quota)
// tant que les données restaurées de la base sont encore considérées
// fraîches. Sans base (SQLite indisponible), on retombe sur 0 (sync au
// premier appel, comportement d'origine).
let lastSyncedAt = getLastSyncedAt();
let syncInFlight: Promise<void> | null = null;

export async function ensureSynced(): Promise<void> {
  const now = Date.now();
  if (now - lastSyncedAt < SYNC_INTERVAL_MS) return;
  if (syncInFlight) return syncInFlight;

  syncInFlight = performSync().finally(() => {
    lastSyncedAt = Date.now();
    setLastSyncedAt(lastSyncedAt);
    syncInFlight = null;
  });
  return syncInFlight;
}

async function performSync(): Promise<void> {
  const provider = getFootballProvider();

  // Les fournisseurs à quota (football-data.org 10 req/min, API-FOOTBALL
  // 100 req/j + 10/min) peuvent répondre temporairement en erreur. On ne
  // veut pas faire tomber les pages en 500 : on garde les dernières
  // données connues en repository (qui sert déjà de cache) et on logge.
  const rawTeams =
    (await provider.getTeams({}).catch((error) => {
      console.error("[sync-service] getTeams échoué, conservation des données en cache.", error);
      return [] as Awaited<ReturnType<typeof provider.getTeams>>;
    })) ?? [];

  const rawCompetitions =
    (await provider.getCompetitions().catch((error) => {
      console.error("[sync-service] getCompetitions échoué, conservation des données en cache.", error);
      return [] as Awaited<ReturnType<typeof provider.getCompetitions>>;
    })) ?? [];

  const rawMatches =
    (await provider.getMatches({}).catch((error) => {
      console.error("[sync-service] getMatches échoué, conservation des données en cache.", error);
      return [] as Awaited<ReturnType<typeof provider.getMatches>>;
    })) ?? [];

  const teamNameByExternalId = new Map(rawTeams.map((t) => [t.externalId, t.name]));

  for (const rawTeam of rawTeams) {
    await repositories.teams.upsert(normalizeTeam(provider.name, rawTeam));
  }

  for (const rawCompetition of rawCompetitions) {
    await repositories.competitions.upsert(normalizeCompetition(provider.name, rawCompetition));
  }

  for (const rawMatch of rawMatches) {
    const homeName = teamNameByExternalId.get(rawMatch.homeTeamExternalId) ?? rawMatch.homeTeamExternalId;
    const awayName = teamNameByExternalId.get(rawMatch.awayTeamExternalId) ?? rawMatch.awayTeamExternalId;
    await repositories.matches.upsert(
      normalizeMatch(provider.name, rawMatch, { home: homeName, away: awayName }),
    );
  }

  const rawPlayers =
    (await provider.getPlayers({}).catch((error) => {
      console.error("[sync-service] getPlayers échoué, conservation des données en cache.", error);
      return [] as Awaited<ReturnType<typeof provider.getPlayers>>;
    })) ?? [];
  for (const rawPlayer of rawPlayers) {
    await repositories.players.upsert(normalizePlayer(provider.name, rawPlayer));
  }
}
