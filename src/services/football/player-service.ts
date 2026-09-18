import { repositories } from "@/db/repositories";
import type { Player } from "@/domain/football/types";
import { getFootballProvider } from "@/config/football-provider";
import { normalizePlayer } from "@/providers/football/normalizer";
import { ensureSynced } from "./sync-service";

export async function getPlayerBySlug(slug: string): Promise<Player | null> {
  await ensureSynced();
  return repositories.players.findBySlug(slug);
}

/**
 * Récupère l'effectif d'une équipe. La synchronisation globale
 * (sync-service.ts) ne peuple pas systématiquement les effectifs — pour
 * un fournisseur réel, cela coûterait un appel par équipe. On les
 * récupère donc paresseusement, à la première visite d'une page équipe,
 * et on les met en cache dans le repository pour les visites suivantes.
 */
export async function getPlayersByTeam(teamId: string): Promise<Player[]> {
  await ensureSynced();
  const cached = await repositories.players.findByTeam(teamId);
  if (cached.length > 0) return cached;

  const provider = getFootballProvider();
  const externalId = teamId.startsWith(`${provider.name}:`) ? teamId.slice(provider.name.length + 1) : teamId;
  const rawPlayers = await provider.getPlayers({ teamExternalId: externalId });

  for (const rawPlayer of rawPlayers) {
    await repositories.players.upsert(normalizePlayer(provider.name, rawPlayer));
  }

  return repositories.players.findByTeam(teamId);
}

export async function searchPlayers(query: string): Promise<Player[]> {
  await ensureSynced();
  return repositories.players.search(query);
}
