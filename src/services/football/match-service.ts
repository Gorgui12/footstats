import { repositories } from "@/db/repositories";
import type { Match, MatchEvent, MatchStatistic } from "@/domain/football/types";
import { getFootballProvider } from "@/config/football-provider";
import { normalizeEvent, normalizeStatistic, internalId } from "@/providers/football/normalizer";
import { ensureSynced } from "./sync-service";

/**
 * Service métier — seul point d'accès aux matchs pour les pages/route
 * handlers. Combine repository + provider selon le besoin, sans jamais
 * exposer les types Raw* du provider.
 */
export async function getLiveMatches(): Promise<Match[]> {
  await ensureSynced();
  return repositories.matches.findLive();
}

export async function getUpcomingMatches(limit = 10): Promise<Match[]> {
  await ensureSynced();
  return repositories.matches.findUpcoming(limit);
}

export async function getRecentMatches(limit = 10): Promise<Match[]> {
  await ensureSynced();
  return repositories.matches.findRecent(limit);
}

export async function getAllMatches(): Promise<Match[]> {
  await ensureSynced();
  return repositories.matches.all();
}

export async function getMatchBySlug(slug: string): Promise<Match | null> {
  await ensureSynced();
  return repositories.matches.findBySlug(slug);
}

export async function getMatchEvents(matchId: string): Promise<MatchEvent[]> {
  await ensureSynced();
  const provider = getFootballProvider();
  // matchId interne -> externalId : on retire le préfixe "<provider>:"
  const externalId = matchId.startsWith(`${provider.name}:`) ? matchId.slice(provider.name.length + 1) : matchId;
  const rawEvents = await provider.getEvents(externalId);
  return rawEvents.map((e) => normalizeEvent(provider.name, e));
}

export async function getMatchStatistics(matchId: string): Promise<MatchStatistic[]> {
  await ensureSynced();
  const provider = getFootballProvider();
  const externalId = matchId.startsWith(`${provider.name}:`) ? matchId.slice(provider.name.length + 1) : matchId;
  const rawStats = await provider.getStatistics(externalId);
  return rawStats.map((s) => normalizeStatistic(provider.name, s));
}

export function buildInternalId(providerName: string, externalId: string): string {
  return internalId(providerName, externalId);
}
