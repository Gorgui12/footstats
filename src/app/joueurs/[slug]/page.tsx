import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPlayerBySlug } from "@/services/football/player-service";
import { repositories } from "@/db/repositories";
import { ensureSynced } from "@/services/football/sync-service";
import { buildMetadata } from "@/lib/seo";
import { FavoriteEntityType, SeoStatus } from "@/domain/football/enums";
import { getCountry } from "@/config/countries";
import { getCurrentUserId } from "@/services/users/current-user-service";
import { isFavorite } from "@/services/users/favorite-service";
import { FavoriteButton } from "@/components/ui/favorite-button";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadPlayerPageData(slug: string) {
  await ensureSynced();
  const player = await getPlayerBySlug(slug);
  if (!player) return null;
  const team = player.currentTeamId ? await repositories.teams.findById(player.currentTeamId) : null;
  return { player, team };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadPlayerPageData(slug);
  if (!data) {
    return buildMetadata({
      title: "Joueur introuvable",
      description: "Ce joueur n'existe pas ou n'est plus disponible.",
      path: `/joueurs/${slug}`,
      seoStatus: SeoStatus.NOINDEX,
    });
  }
  const { player } = data;
  return buildMetadata({
    title: player.fullName,
    description: `Statistiques, équipe et actualités de ${player.fullName} sur FootStats Africa.`,
    path: `/joueurs/${player.slug}`,
    seoStatus: player.seoStatus,
    imageUrl: player.photoUrl,
  });
}

export default async function PlayerPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await loadPlayerPageData(slug);
  if (!data) notFound();
  const { player, team } = data;
  const nationality = player.nationalityCountryId ? getCountry(player.nationalityCountryId) : null;
  const userId = await getCurrentUserId();
  const favorited = await isFavorite(userId, FavoriteEntityType.PLAYER, player.id);

  return (
    <div className="space-y-6">
      <div className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            {nationality && <p className="text-xs uppercase tracking-wider text-white/50">{nationality.name}</p>}
            <h1 className="text-2xl font-bold">{player.fullName}</h1>
            <p className="text-sm text-white/50">
              {player.position ?? "Poste non renseigné"}
              {team && <> — {team.name}</>}
            </p>
          </div>
          <FavoriteButton
            entityType={FavoriteEntityType.PLAYER}
            entityId={player.id}
            isFavorite={favorited}
            redirectPath={`/joueurs/${player.slug}`}
          />
        </div>
      </div>

      <div className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-white/60">Statistiques</h2>
        <p className="text-sm text-white/50">Information non disponible.</p>
      </div>
    </div>
  );
}
