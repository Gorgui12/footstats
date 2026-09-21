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
import { getPreferredCountryCode } from "@/services/users/country-preference-service";
import { FavoriteEntityType } from "@/domain/football/enums";
import { isSupportedLocale, localizedHref, DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

// Données live mises à jour par le sync-service (provider à quota) :
// on force le rendu à la demande plutôt que de pré-générer à build, ce
// qui évite aussi d'appeler l'API externe pendant `next build`.
export const dynamic = "force-dynamic";

function teamsById(teams: Team[]) {
  return new Map(teams.map((t) => [t.id, t]));
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  const [live, upcoming, recent, teams, countryCode] = await Promise.all([
    getLiveMatches(),
    getUpcomingMatches(6),
    getRecentMatches(6),
    getAllTeams(),
    getPreferredCountryCode(),
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

  const matchCardProps = { locale, dict, countryCode };

  return (
    <div className="space-y-12">
      {favoriteHighlights.length > 0 && (
        <section>
          <SectionHeader title={dict.home.yourFavorites} href={localizedHref(locale, "/favoris")} hrefLabel={dict.common.manage} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteHighlights.map((m) => (
              <MatchCard key={m.id} match={m} homeTeam={byId.get(m.homeTeamId) ?? null} awayTeam={byId.get(m.awayTeamId) ?? null} {...matchCardProps} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-live" />
          <h1 className="text-sm font-medium uppercase tracking-wider text-white/60">{dict.home.live}</h1>
        </div>
        {live.length === 0 ? (
          <EmptyState message={dict.home.noLiveMatches} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((m) => (
              <MatchCard key={m.id} match={m} homeTeam={byId.get(m.homeTeamId) ?? null} awayTeam={byId.get(m.awayTeamId) ?? null} {...matchCardProps} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title={dict.home.upcomingMatches} href={localizedHref(locale, "/matchs")} hrefLabel={dict.common.seeAll} />
        {upcoming.length === 0 ? (
          <EmptyState message={dict.home.noUpcomingMatches} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((m) => (
              <MatchCard key={m.id} match={m} homeTeam={byId.get(m.homeTeamId) ?? null} awayTeam={byId.get(m.awayTeamId) ?? null} {...matchCardProps} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title={dict.home.recentResults} href={localizedHref(locale, "/matchs")} hrefLabel={dict.common.seeAll} />
        {recent.length === 0 ? (
          <EmptyState message={dict.home.noRecentResults} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((m) => (
              <MatchCard key={m.id} match={m} homeTeam={byId.get(m.homeTeamId) ?? null} awayTeam={byId.get(m.awayTeamId) ?? null} {...matchCardProps} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title={dict.home.popularCompetitions} href={localizedHref(locale, "/competitions")} hrefLabel={dict.common.seeAll} />
        <div className="flex flex-wrap gap-3">
          {featuredCompetitions.map((c) => (
            <Link
              key={c.slug}
              href={localizedHref(locale, `/competitions/${c.slug}`)}
              className="rounded-full border border-white/10 bg-pitch-900/60 px-4 py-2 text-sm text-white/80 hover:border-brand-500/40 hover:text-white"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title={dict.home.playersToWatch} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_PLAYERS.map((p) => (
            <div key={p.externalId} className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-4">
              <p className="font-medium">{p.fullName}</p>
              <p className="text-sm text-white/50">{p.position ?? dict.playerPage.noPositionListed}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
