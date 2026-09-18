import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUserId } from "@/services/users/current-user-service";
import { listFavorites } from "@/services/users/favorite-service";
import { repositories } from "@/db/repositories";
import { ensureSynced } from "@/services/football/sync-service";
import { FavoriteEntityType, SeoStatus } from "@/domain/football/enums";
import { EmptyState } from "@/components/ui/states";
import { MatchCard } from "@/components/football/match-card";
import { SectionHeader } from "@/components/football/section-header";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Mes favoris",
  description: "Vos équipes, joueurs et compétitions suivis sur FootStats Africa.",
  path: "/favoris",
  seoStatus: SeoStatus.NOINDEX,
});

export default async function FavoritesPage() {
  await ensureSynced();
  const userId = await getCurrentUserId();
  const favorites = userId ? await listFavorites(userId) : [];

  const teamIds = favorites.filter((f) => f.entityType === FavoriteEntityType.TEAM).map((f) => f.entityId);
  const playerIds = favorites.filter((f) => f.entityType === FavoriteEntityType.PLAYER).map((f) => f.entityId);
  const competitionIds = favorites
    .filter((f) => f.entityType === FavoriteEntityType.COMPETITION)
    .map((f) => f.entityId);

  const [teams, players, competitions, allTeams, allMatches] = await Promise.all([
    Promise.all(teamIds.map((id) => repositories.teams.findById(id))),
    Promise.all(playerIds.map((id) => repositories.players.findById(id))),
    Promise.all(competitionIds.map((id) => repositories.competitions.findById(id))),
    repositories.teams.all(),
    repositories.matches.all(),
  ]);

  const byId = new Map(allTeams.map((t) => [t.id, t]));
  const upcomingForFavorites = allMatches
    .filter((m) => teamIds.includes(m.homeTeamId) || teamIds.includes(m.awayTeamId))
    .filter((m) => new Date(m.kickoffAtUtc).getTime() > Date.now())
    .sort((a, b) => new Date(a.kickoffAtUtc).getTime() - new Date(b.kickoffAtUtc).getTime());

  const hasAnyFavorite = favorites.length > 0;

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">Mes favoris</h1>

      {!hasAnyFavorite ? (
        <EmptyState message="Vous n'avez pas encore de favoris. Ajoutez une équipe, un joueur ou une compétition depuis sa page." />
      ) : (
        <>
          {teamIds.length > 0 && (
            <section>
              <SectionHeader title="Prochains matchs de vos équipes" />
              {upcomingForFavorites.length === 0 ? (
                <EmptyState message="Aucun match à venir pour vos équipes favorites." />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {upcomingForFavorites.map((m) => (
                    <MatchCard key={m.id} match={m} homeTeam={byId.get(m.homeTeamId) ?? null} awayTeam={byId.get(m.awayTeamId) ?? null} />
                  ))}
                </div>
              )}
            </section>
          )}

          <section>
            <SectionHeader title="Équipes suivies" />
            {teams.filter(Boolean).length === 0 ? (
              <EmptyState message="Aucune équipe suivie." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {teams.filter(Boolean).map((t) => (
                  <Link key={t!.id} href={`/equipes/${t!.slug}`} className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-4 hover:border-brand-500/40">
                    {t!.name}
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionHeader title="Joueurs suivis" />
            {players.filter(Boolean).length === 0 ? (
              <EmptyState message="Aucun joueur suivi." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {players.filter(Boolean).map((p) => (
                  <Link key={p!.id} href={`/joueurs/${p!.slug}`} className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-4 hover:border-brand-500/40">
                    {p!.fullName}
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionHeader title="Compétitions suivies" />
            {competitions.filter(Boolean).length === 0 ? (
              <EmptyState message="Aucune compétition suivie." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {competitions.filter(Boolean).map((c) => (
                  <Link key={c!.id} href={`/competitions/${c!.slug}`} className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-4 hover:border-brand-500/40">
                    {c!.name}
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
