import type { Metadata } from "next";
import { MatchCard } from "@/components/football/match-card";
import { SectionHeader } from "@/components/football/section-header";
import { EmptyState } from "@/components/ui/states";
import { getAllMatches } from "@/services/football/match-service";
import { repositories } from "@/db/repositories";
import { ensureSynced } from "@/services/football/sync-service";
import { getPreferredCountryCode } from "@/services/users/country-preference-service";
import { buildMetadata } from "@/lib/seo";
import { SeoStatus } from "@/domain/football/enums";
import { isToday } from "@/lib/timezone";
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
    title: locale === "en" ? "All matches" : "Tous les matchs",
    description:
      locale === "en"
        ? "Schedule, today's matches, and results for Senegalese and African football."
        : "Calendrier, matchs du jour et résultats du football sénégalais et africain.",
    path: localizedHref(locale, "/matchs"),
    unlocalizedPath: "/matchs",
    locale,
    seoStatus: SeoStatus.INDEXABLE,
  });
}

export default async function MatchsPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  await ensureSynced();
  const [matches, teams, countryCode] = await Promise.all([
    getAllMatches(),
    repositories.teams.all(),
    getPreferredCountryCode(),
  ]);
  const byId = new Map(teams.map((t) => [t.id, t]));

  const todayMatches = matches.filter((m) => isToday(m.kickoffAtUtc, countryCode));
  const otherMatches = matches.filter((m) => !isToday(m.kickoffAtUtc, countryCode));
  const matchCardProps = { locale, dict, countryCode };

  return (
    <div className="space-y-10">
      <section>
        <SectionHeader title={dict.matchesPage.today} />
        {todayMatches.length === 0 ? (
          <EmptyState message={dict.matchesPage.noMatchesToday} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {todayMatches.map((m) => (
              <MatchCard key={m.id} match={m} homeTeam={byId.get(m.homeTeamId) ?? null} awayTeam={byId.get(m.awayTeamId) ?? null} {...matchCardProps} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title={dict.matchesPage.otherMatches} />
        {otherMatches.length === 0 ? (
          <EmptyState message={dict.matchesPage.noOtherMatches} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherMatches.map((m) => (
              <MatchCard key={m.id} match={m} homeTeam={byId.get(m.homeTeamId) ?? null} awayTeam={byId.get(m.awayTeamId) ?? null} {...matchCardProps} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
