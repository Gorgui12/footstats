import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getCompetitionBySlug, getCompetitionMatches } from "@/services/football/competition-service";
import { repositories } from "@/db/repositories";
import { ensureSynced } from "@/services/football/sync-service";
import { MatchCard } from "@/components/football/match-card";
import { SectionHeader } from "@/components/football/section-header";
import { EmptyState } from "@/components/ui/states";
import { buildMetadata } from "@/lib/seo";
import { FavoriteEntityType, SeoStatus } from "@/domain/football/enums";
import { getCurrentUserId } from "@/services/users/current-user-service";
import { isFavorite } from "@/services/users/favorite-service";
import { FavoriteButton } from "@/components/ui/favorite-button";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadCompetitionPageData(slug: string) {
  await ensureSynced();
  const competition = await getCompetitionBySlug(slug);
  if (!competition) return null;
  const [matches, teams] = await Promise.all([
    getCompetitionMatches(competition.id),
    repositories.teams.all(),
  ]);
  return { competition, matches, teams };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadCompetitionPageData(slug);
  if (!data) {
    return buildMetadata({
      title: "Compétition introuvable",
      description: "Cette compétition n'existe pas ou n'est plus disponible.",
      path: `/competitions/${slug}`,
      seoStatus: SeoStatus.NOINDEX,
    });
  }
  const { competition } = data;
  return buildMetadata({
    title: competition.name,
    description: `Classement, matchs et résultats de ${competition.name} sur FootStats Africa.`,
    path: `/competitions/${competition.slug}`,
    seoStatus: competition.seoStatus,
    imageUrl: competition.logoUrl,
  });
}

export default async function CompetitionPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await loadCompetitionPageData(slug);
  if (!data) notFound();
  const { competition, matches, teams } = data;
  const byId = new Map(teams.map((t) => [t.id, t]));
  const userId = await getCurrentUserId();
  const favorited = await isFavorite(userId, FavoriteEntityType.COMPETITION, competition.id);

  return (
    <div className="space-y-8">
      <div className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{competition.name}</h1>
            <Link href={`/classement/${competition.slug}`} className="text-sm text-brand-300 hover:text-brand-100">
              Voir le classement →
            </Link>
          </div>
          <FavoriteButton
            entityType={FavoriteEntityType.COMPETITION}
            entityId={competition.id}
            isFavorite={favorited}
            redirectPath={`/competitions/${competition.slug}`}
          />
        </div>
      </div>

      <section>
        <SectionHeader title="Matchs" />
        {matches.length === 0 ? (
          <EmptyState message="Aucun match disponible pour cette compétition." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => (
              <MatchCard key={m.id} match={m} homeTeam={byId.get(m.homeTeamId) ?? null} awayTeam={byId.get(m.awayTeamId) ?? null} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
