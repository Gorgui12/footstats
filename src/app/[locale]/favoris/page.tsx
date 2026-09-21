import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUserId } from "@/services/users/current-user-service";
import { listFavorites } from "@/services/users/favorite-service";
import { repositories } from "@/db/repositories";
import { ensureSynced } from "@/services/football/sync-service";
import { getPreferredCountryCode } from "@/services/users/country-preference-service";
import { FavoriteEntityType, SeoStatus } from "@/domain/football/enums";
import { EmptyState } from "@/components/ui/states";
import { MatchCard } from "@/components/football/match-card";
import { SectionHeader } from "@/components/football/section-header";
import { buildMetadata } from "@/lib/seo";
import { isSupportedLocale, localizedHref, DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

// Données live mises à jour par le sync-service (provider à quota) :
// rendu à la demande, pas de pré-génération pendant `next build`.
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  return buildMetadata({
    title: locale === "en" ? "My favorites" : "Mes favoris",
    description:
      locale === "en"
        ? "Your followed teams, players, and competitions on FootStats Africa."
        : "Vos équipes, joueurs et compétitions suivis sur FootStats Africa.",
    path: localizedHref(locale, "/favoris"),
    seoStatus: SeoStatus.NOINDEX,
  });
}

export default async function FavoritesPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  await ensureSynced();
  const userId = await getCurrentUserId();
  const countryCode = await getPreferredCountryCode();
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
  const matchCardProps = { locale, dict, countryCode };

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">{dict.favoritesPage.title}</h1>

      {!hasAnyFavorite ? (
        <EmptyState message={dict.favoritesPage.empty} />
      ) : (
        <>
          {teamIds.length > 0 && (
            <section>
              <SectionHeader title={dict.favoritesPage.upcomingForFavoriteTeams} />
              {upcomingForFavorites.length === 0 ? (
                <EmptyState message={dict.favoritesPage.noUpcomingForFavorites} />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {upcomingForFavorites.map((m) => (
                    <MatchCard key={m.id} match={m} homeTeam={byId.get(m.homeTeamId) ?? null} awayTeam={byId.get(m.awayTeamId) ?? null} {...matchCardProps} />
                  ))}
                </div>
              )}
            </section>
          )}

          <section>
            <SectionHeader title={dict.favoritesPage.followedTeams} />
            {teams.filter(Boolean).length === 0 ? (
              <EmptyState message={dict.favoritesPage.noFollowedTeams} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {teams.filter(Boolean).map((t) => (
                  <Link key={t!.id} href={localizedHref(locale, `/equipes/${t!.slug}`)} className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-4 hover:border-brand-500/40">
                    {t!.name}
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionHeader title={dict.favoritesPage.followedPlayers} />
            {players.filter(Boolean).length === 0 ? (
              <EmptyState message={dict.favoritesPage.noFollowedPlayers} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {players.filter(Boolean).map((p) => (
                  <Link key={p!.id} href={localizedHref(locale, `/joueurs/${p!.slug}`)} className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-4 hover:border-brand-500/40">
                    {p!.fullName}
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionHeader title={dict.favoritesPage.followedCompetitions} />
            {competitions.filter(Boolean).length === 0 ? (
              <EmptyState message={dict.favoritesPage.noFollowedCompetitions} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {competitions.filter(Boolean).map((c) => (
                  <Link key={c!.id} href={localizedHref(locale, `/competitions/${c!.slug}`)} className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-4 hover:border-brand-500/40">
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
