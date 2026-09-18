import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTeamBySlug, getTeamMatches } from "@/services/football/team-service";
import { getPlayersByTeam } from "@/services/football/player-service";
import { repositories } from "@/db/repositories";
import { ensureSynced } from "@/services/football/sync-service";
import { MatchCard } from "@/components/football/match-card";
import { SectionHeader } from "@/components/football/section-header";
import { EmptyState } from "@/components/ui/states";
import { buildMetadata } from "@/lib/seo";
import { getCountry } from "@/config/countries";
import { FavoriteEntityType, SeoStatus } from "@/domain/football/enums";
import { getCurrentUserId } from "@/services/users/current-user-service";
import { isFavorite } from "@/services/users/favorite-service";
import { FavoriteButton } from "@/components/ui/favorite-button";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadTeamPageData(slug: string) {
  await ensureSynced();
  const team = await getTeamBySlug(slug);
  if (!team) return null;
  const [matches, players] = await Promise.all([getTeamMatches(team.id), getPlayersByTeam(team.id)]);
  const teams = await repositories.teams.all();
  return { team, matches, players, teams };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadTeamPageData(slug);
  if (!data) {
    return buildMetadata({
      title: "Équipe introuvable",
      description: "Cette équipe n'existe pas ou n'est plus disponible.",
      path: `/equipes/${slug}`,
      seoStatus: SeoStatus.NOINDEX,
    });
  }
  const { team } = data;
  return buildMetadata({
    title: team.name,
    description: `Résultats, prochains matchs, effectif et classement de ${team.name} sur FootStats Africa.`,
    path: `/equipes/${team.slug}`,
    seoStatus: team.seoStatus,
    imageUrl: team.logoUrl,
  });
}

export default async function TeamPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await loadTeamPageData(slug);
  if (!data) notFound();
  const { team, matches, players, teams } = data;
  const byId = new Map(teams.map((t) => [t.id, t]));
  const country = getCountry(team.countryId);
  const userId = await getCurrentUserId();
  const favorited = await isFavorite(userId, FavoriteEntityType.TEAM, team.id);

  const upcoming = matches
    .filter((m) => new Date(m.kickoffAtUtc).getTime() > Date.now())
    .sort((a, b) => new Date(a.kickoffAtUtc).getTime() - new Date(b.kickoffAtUtc).getTime());
  const past = matches
    .filter((m) => new Date(m.kickoffAtUtc).getTime() <= Date.now())
    .sort((a, b) => new Date(b.kickoffAtUtc).getTime() - new Date(a.kickoffAtUtc).getTime());

  return (
    <div className="space-y-10">
      <div className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/50">{country.name}</p>
            <h1 className="text-2xl font-bold">{team.name}</h1>
            {team.foundedYear && <p className="text-sm text-white/50">Fondé en {team.foundedYear}</p>}
          </div>
          <FavoriteButton
            entityType={FavoriteEntityType.TEAM}
            entityId={team.id}
            isFavorite={favorited}
            redirectPath={`/equipes/${team.slug}`}
          />
        </div>
      </div>

      <section>
        <SectionHeader title="Effectif" />
        {players.length === 0 ? (
          <EmptyState message="Aucun effectif disponible pour cette équipe." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((p) => (
              <div key={p.id} className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-4">
                <p className="font-medium">{p.fullName}</p>
                <p className="text-sm text-white/50">{p.position ?? "Poste non renseigné"}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Prochains matchs" />
        {upcoming.length === 0 ? (
          <EmptyState message="Aucun prochain match connu." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((m) => (
              <MatchCard key={m.id} match={m} homeTeam={byId.get(m.homeTeamId) ?? null} awayTeam={byId.get(m.awayTeamId) ?? null} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Derniers résultats" />
        {past.length === 0 ? (
          <EmptyState message="Aucun résultat récent." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((m) => (
              <MatchCard key={m.id} match={m} homeTeam={byId.get(m.homeTeamId) ?? null} awayTeam={byId.get(m.awayTeamId) ?? null} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
