import { getFootballProvider } from "@/config/football-provider";
import { repositories } from "@/db/repositories";
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
let lastSyncedAt = 0;
let syncInFlight: Promise<void> | null = null;

export async function ensureSynced(): Promise<void> {
  const now = Date.now();
  if (now - lastSyncedAt < SYNC_INTERVAL_MS) return;
  if (syncInFlight) return syncInFlight;

  syncInFlight = performSync().finally(() => {
    lastSyncedAt = Date.now();
    syncInFlight = null;
  });
  return syncInFlight;
}

async function performSync(): Promise<void> {
  const provider = getFootballProvider();

  const [rawTeams, rawCompetitions, rawMatches] = await Promise.all([
    provider.getTeams({}),
    provider.getCompetitions(),
    provider.getMatches({}),
  ]);

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

  const rawPlayers = await provider.getPlayers({});
  for (const rawPlayer of rawPlayers) {
    await repositories.players.upsert(normalizePlayer(provider.name, rawPlayer));
  }
}
