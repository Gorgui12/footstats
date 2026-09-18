import { repositories } from "@/db/repositories";
import type { Competition, Standing } from "@/domain/football/types";
import { getFootballProvider } from "@/config/football-provider";
import { normalizeStanding } from "@/providers/football/normalizer";
import { ensureSynced } from "./sync-service";

export async function getAllCompetitions(): Promise<Competition[]> {
  await ensureSynced();
  return repositories.competitions.all();
}

export async function getCompetitionBySlug(slug: string): Promise<Competition | null> {
  await ensureSynced();
  return repositories.competitions.findBySlug(slug);
}

export async function getCompetitionMatches(competitionId: string) {
  await ensureSynced();
  return repositories.matches.findByCompetition(competitionId);
}

/**
 * Récupère le classement à la demande, par compétition, plutôt que de le
 * pré-charger pour toutes les compétitions pendant la synchronisation
 * globale — évite une rafale d'appels au provider à chaque sync (voir
 * sync-service.ts). Le repository sert de cache : en cas d'échec ou de
 * réponse vide du provider (ex. quota atteint), on retombe sur la
 * dernière valeur connue plutôt que d'afficher un classement vide.
 */
export async function getStandings(competitionId: string, seasonId: string): Promise<Standing[]> {
  await ensureSynced();

  const provider = getFootballProvider();
  const externalCompetitionId = competitionId.startsWith(`${provider.name}:`)
    ? competitionId.slice(provider.name.length + 1)
    : competitionId;
  const seasonLabel = seasonId.startsWith(`${competitionId}:`) ? seasonId.slice(competitionId.length + 1) : seasonId;

  const rawStandings = await provider.getStandings(externalCompetitionId, seasonLabel);

  if (rawStandings.length > 0) {
    const normalized = rawStandings.map((s) => normalizeStanding(provider.name, s));
    await repositories.standings.upsertMany(normalized);
    return [...normalized].sort((a, b) => a.position - b.position);
  }

  return repositories.standings.findByCompetitionAndSeason(competitionId, seasonId);
}
