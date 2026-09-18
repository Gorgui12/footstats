import { repositories } from "@/db/repositories";
import type { Team } from "@/domain/football/types";
import { ensureSynced } from "./sync-service";

export async function getAllTeams(): Promise<Team[]> {
  await ensureSynced();
  return repositories.teams.all();
}

export async function getTeamBySlug(slug: string): Promise<Team | null> {
  await ensureSynced();
  return repositories.teams.findBySlug(slug);
}

export async function getTeamsByCountry(countryId: string): Promise<Team[]> {
  await ensureSynced();
  return repositories.teams.findByCountry(countryId);
}

export async function getTeamMatches(teamId: string) {
  await ensureSynced();
  const all = await repositories.matches.all();
  return all.filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId);
}
