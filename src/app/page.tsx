import { MatchCard } from "@/components/football/match-card";
import { SectionHeader } from "@/components/football/section-header";
import { EmptyState } from "@/components/ui/states";
import { getLiveMatches, getRecentMatches, getUpcomingMatches } from "@/services/football/match-service";
import { getAllTeams } from "@/services/football/team-service";
import { getFeaturedCompetitions } from "@/config/competitions";
import { DEMO_PLAYERS } from "@/providers/football/mock/fixtures";
import Link from "next/link";
import type { Team } from "@/domain/football/types";
import { getCurrentUserId } from "@/services/users/current-user-service";
import { listFavoriteIdsByType } from "@/services/users/favorite-service";
import { FavoriteEntityType } from "@/domain/football/enums";

function teamsById(teams: Team[]) {
  return new Map(teams.map((t) => [t.id, t]));
}

export default async function HomePage() {
  const [live, upcoming, recent, teams] = await Promise.all([
    getLiveMatches(),
    getUpcomingMatches(6),
    getRecentMatches(6),
    getAllTeams(),
  ]);
  const byId = teamsById(teams);
  const featuredCompetitions = getFeaturedCompetitions();

  // Personnalisation basique (Niveau 2) : si l'utilisateur suit des
  // équipes, on met en avant leurs matchs (en direct ou à venir) en tête
  // de page.
  const userId = await getCurrentUserId();
  const favoriteTeamIds = userId ? await listFavoriteIdsByType(userId, FavoriteEntityType.TEAM) : [];
  const isFavoriteMatch = (homeTeamId: string, awayTeamId: string) =>
    favoriteTeamIds.includes(homeTeamId) || favoriteTeamIds.includes(awayTeamId);
  const favoriteHighlights =
    favoriteTeamIds.length > 0
      ? [...live, ...upcoming].filter((m) => isFavoriteMatch(m.homeTeamId, m.awayTeamId))
      : [];

  return (
    <div className="space-y-12">
      {favoriteHighlights.length > 0 && (
        <section>
          <SectionHeader title="Vos favoris" href="/favoris" hrefLabel="Gérer" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteHighlights.map((m) => (
              <MatchCard key={m.id} match={m} homeTeam={byId.get(m.homeTeamId) ?? null} awayTeam={byId.get(m.awayTeamId) ?? null} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-live" />
          <h1 className="text-sm font-medium uppercase tracking-wider text-white/60">En direct</h1>
        </div>
        {live.length === 0 ? (
          <EmptyState message="Aucun match en direct pour le moment." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                homeTeam={byId.get(m.homeTeamId) ?? null}
                awayTeam={byId.get(m.awayTeamId) ?? null}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Prochains matchs" href="/matchs" />
        {upcoming.length === 0 ? (
          <EmptyState message="Aucun match à venir pour le moment." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                homeTeam={byId.get(m.homeTeamId) ?? null}
                awayTeam={byId.get(m.awayTeamId) ?? null}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Résultats récents" href="/matchs" />
        {recent.length === 0 ? (
          <EmptyState message="Aucun résultat récent pour le moment." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                homeTeam={byId.get(m.homeTeamId) ?? null}
                awayTeam={byId.get(m.awayTeamId) ?? null}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Compétitions populaires" href="/competitions" />
        <div className="flex flex-wrap gap-3">
          {featuredCompetitions.map((c) => (
            <Link
              key={c.slug}
              href={`/competitions/${c.slug}`}
              className="rounded-full border border-white/10 bg-pitch-900/60 px-4 py-2 text-sm text-white/80 hover:border-brand-500/40 hover:text-white"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Joueurs africains à suivre" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_PLAYERS.map((p) => (
            <div key={p.externalId} className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-4">
              <p className="font-medium">{p.fullName}</p>
              <p className="text-sm text-white/50">{p.position ?? "Poste non renseigné"}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
