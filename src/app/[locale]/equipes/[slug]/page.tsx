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

async function loadTeamPageData(slug: string) {
  await ensureSynced();
  const team = await getTeamBySlug(slug);
  if (!team) return null;
  const [matches, players] = await Promise.all([getTeamMatches(team.id), getPlayersByTeam(team.id)]);
  const teams = await repositories.teams.all();
  return { team, matches, players, teams };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const data = await loadTeamPageData(slug);
  if (!data) {
    return buildMetadata({
      title: dict.teamPage.notFoundTitle,
      description: dict.teamPage.notFoundDescription,
      path: localizedHref(locale, `/equipes/${slug}`),
      unlocalizedPath: `/equipes/${slug}`,
      locale,
      seoStatus: SeoStatus.NOINDEX,
    });
  }
  const { team } = data;
  const description =
    locale === "en"
      ? `Results, upcoming matches, squad and standings for ${team.name} on FootStats Africa.`
      : `Résultats, prochains matchs, effectif et classement de ${team.name} sur FootStats Africa.`;
  return buildMetadata({
    title: team.name,
    description,
    path: localizedHref(locale, `/equipes/${team.slug}`),
    unlocalizedPath: `/equipes/${team.slug}`,
    locale,
    seoStatus: team.seoStatus,
    imageUrl: team.logoUrl,
  });
}

export default async function TeamPage({ params }: PageProps) {
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const countryCode = await getPreferredCountryCode();

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
  const matchCardProps = { locale, dict, countryCode };

  return (
    <div className="space-y-10">
      <div className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/50">{country.name}</p>
            <h1 className="text-2xl font-bold">{team.name}</h1>
            {team.foundedYear && <p className="text-sm text-white/50">{dict.teamPage.foundedIn} {team.foundedYear}</p>}
          </div>
          <FavoriteButton
            entityType={FavoriteEntityType.TEAM}
            entityId={team.id}
            isFavorite={favorited}
            redirectPath={localizedHref(locale, `/equipes/${team.slug}`)}
            dict={dict}
          />
        </div>
      </div>

      <section>
        <SectionHeader title={dict.teamPage.squad} />
        {players.length === 0 ? (
          <EmptyState message={dict.teamPage.noSquad} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((p) => (
              <div key={p.id} className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-4">
                <p className="font-medium">{p.fullName}</p>
                <p className="text-sm text-white/50">{p.position ?? dict.playerPage.noPositionListed}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title={dict.teamPage.upcomingMatches} />
        {upcoming.length === 0 ? (
          <EmptyState message={dict.teamPage.noUpcomingMatches} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((m) => (
              <MatchCard key={m.id} match={m} homeTeam={byId.get(m.homeTeamId) ?? null} awayTeam={byId.get(m.awayTeamId) ?? null} {...matchCardProps} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title={dict.teamPage.recentResults} />
        {past.length === 0 ? (
          <EmptyState message={dict.teamPage.noRecentResults} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((m) => (
              <MatchCard key={m.id} match={m} homeTeam={byId.get(m.homeTeamId) ?? null} awayTeam={byId.get(m.awayTeamId) ?? null} {...matchCardProps} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
