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
import { getPreferredCountryCode } from "@/services/users/country-preference-service";
import { FavoriteEntityType, SeoStatus } from "@/domain/football/enums";
import { getCurrentUserId } from "@/services/users/current-user-service";
import { isFavorite } from "@/services/users/favorite-service";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { isSupportedLocale, localizedHref, DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
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
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const data = await loadCompetitionPageData(slug);
  if (!data) {
    return buildMetadata({
      title: dict.competitionPage.notFoundTitle,
      description: dict.competitionPage.notFoundDescription,
      path: localizedHref(locale, `/competitions/${slug}`),
      unlocalizedPath: `/competitions/${slug}`,
      locale,
      seoStatus: SeoStatus.NOINDEX,
    });
  }
  const { competition } = data;
  const description =
    locale === "en"
      ? `Standings, matches, and results for ${competition.name} on FootStats Africa.`
      : `Classement, matchs et résultats de ${competition.name} sur FootStats Africa.`;
  return buildMetadata({
    title: competition.name,
    description,
    path: localizedHref(locale, `/competitions/${competition.slug}`),
    unlocalizedPath: `/competitions/${competition.slug}`,
    locale,
    seoStatus: competition.seoStatus,
    imageUrl: competition.logoUrl,
  });
}

export default async function CompetitionPage({ params }: PageProps) {
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const countryCode = await getPreferredCountryCode();

  const data = await loadCompetitionPageData(slug);
  if (!data) notFound();
  const { competition, matches, teams } = data;
  const byId = new Map(teams.map((t) => [t.id, t]));
  const userId = await getCurrentUserId();
  const favorited = await isFavorite(userId, FavoriteEntityType.COMPETITION, competition.id);
  const matchCardProps = { locale, dict, countryCode };

  return (
    <div className="space-y-8">
      <div className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{competition.name}</h1>
            <Link href={localizedHref(locale, `/classement/${competition.slug}`)} className="text-sm text-brand-300 hover:text-brand-100">
              {dict.competitionPage.seeStandings} →
            </Link>
          </div>
          <FavoriteButton
            entityType={FavoriteEntityType.COMPETITION}
            entityId={competition.id}
            isFavorite={favorited}
            redirectPath={localizedHref(locale, `/competitions/${competition.slug}`)}
            dict={dict}
          />
        </div>
      </div>

      <section>
        <SectionHeader title={dict.competitionPage.matches} />
        {matches.length === 0 ? (
          <EmptyState message={dict.competitionPage.noMatches} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => (
              <MatchCard key={m.id} match={m} homeTeam={byId.get(m.homeTeamId) ?? null} awayTeam={byId.get(m.awayTeamId) ?? null} {...matchCardProps} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
