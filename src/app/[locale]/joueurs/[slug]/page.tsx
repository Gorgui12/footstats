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
import { isSupportedLocale, localizedHref, DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

async function loadPlayerPageData(slug: string) {
  await ensureSynced();
  const player = await getPlayerBySlug(slug);
  if (!player) return null;
  const team = player.currentTeamId ? await repositories.teams.findById(player.currentTeamId) : null;
  return { player, team };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const data = await loadPlayerPageData(slug);
  if (!data) {
    return buildMetadata({
      title: dict.playerPage.notFoundTitle,
      description: dict.playerPage.notFoundDescription,
      path: localizedHref(locale, `/joueurs/${slug}`),
      unlocalizedPath: `/joueurs/${slug}`,
      locale,
      seoStatus: SeoStatus.NOINDEX,
    });
  }
  const { player } = data;
  const description =
    locale === "en"
      ? `Statistics, team, and news for ${player.fullName} on FootStats Africa.`
      : `Statistiques, équipe et actualités de ${player.fullName} sur FootStats Africa.`;
  return buildMetadata({
    title: player.fullName,
    description,
    path: localizedHref(locale, `/joueurs/${player.slug}`),
    unlocalizedPath: `/joueurs/${player.slug}`,
    locale,
    seoStatus: player.seoStatus,
    imageUrl: player.photoUrl,
  });
}

export default async function PlayerPage({ params }: PageProps) {
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
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
              {player.position ?? dict.playerPage.noPositionListed}
              {team && <> — {team.name}</>}
            </p>
          </div>
          <FavoriteButton
            entityType={FavoriteEntityType.PLAYER}
            entityId={player.id}
            isFavorite={favorited}
            redirectPath={localizedHref(locale, `/joueurs/${player.slug}`)}
            dict={dict}
          />
        </div>
      </div>

      <div className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-white/60">{dict.playerPage.statistics}</h2>
        <p className="text-sm text-white/50">{dict.playerPage.infoUnavailable}</p>
      </div>
    </div>
  );
}
