import type { Match, Team } from "@/domain/football/types";
import { formatLocalTime } from "@/lib/timezone";

/**
 * Fondation du bot Telegram (brief §35, ROADMAP Phase D). Ces fonctions ne
 * dépendent d'aucun composant frontend — elles pourront être appelées
 * aussi bien par un futur worker Telegram que par un test.
 */
export function formatMatchStartMessage(match: Match, homeTeam: Team | null, awayTeam: Team | null): string {
  const time = formatLocalTime(match.kickoffAtUtc, "SN");
  return [
    `⚽ ${homeTeam?.name ?? "Équipe"} vs ${awayTeam?.name ?? "Équipe"}`,
    ``,
    `🕐 ${time}`,
    `📺 Diffusion : information indisponible`,
  ].join("\n");
}

export function formatGoalMessage(
  match: Match,
  homeTeam: Team | null,
  awayTeam: Team | null,
  scoringTeamName: string,
): string {
  return [
    `⚽ BUT ! (${scoringTeamName})`,
    ``,
    `${homeTeam?.name ?? "Équipe"} ${match.homeScore ?? 0} - ${match.awayScore ?? 0} ${awayTeam?.name ?? "Équipe"}`,
  ].join("\n");
}
