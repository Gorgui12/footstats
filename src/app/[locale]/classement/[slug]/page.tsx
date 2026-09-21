import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCompetitionBySlug, getStandings } from "@/services/football/competition-service";
import { repositories } from "@/db/repositories";
import { ensureSynced } from "@/services/football/sync-service";
import { EmptyState } from "@/components/ui/states";
import { buildMetadata } from "@/lib/seo";
import { SeoStatus } from "@/domain/football/enums";
import { isSupportedLocale, localizedHref, DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

async function loadStandingsPageData(slug: string) {
  await ensureSynced();
  const competition = await getCompetitionBySlug(slug);
  if (!competition) return null;
  const matches = await repositories.matches.findByCompetition(competition.id);
  const seasonId = matches[0]?.seasonId ?? `${competition.id}:current`;
  const [standings, teams] = await Promise.all([
    getStandings(competition.id, seasonId),
    repositories.teams.all(),
  ]);
  return { competition, standings, teams };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const data = await loadStandingsPageData(slug);
  if (!data) {
    return buildMetadata({
      title: dict.standingsPage.notFoundTitle,
      description: dict.standingsPage.notFoundDescription,
      path: localizedHref(locale, `/classement/${slug}`),
      unlocalizedPath: `/classement/${slug}`,
      locale,
      seoStatus: SeoStatus.NOINDEX,
    });
  }
  const { competition } = data;
  const description =
    locale === "en"
      ? `Full standings for ${competition.name} on FootStats Africa.`
      : `Classement complet de ${competition.name} sur FootStats Africa.`;
  return buildMetadata({
    title: `${dict.standingsPage.title} — ${competition.name}`,
    description,
    path: localizedHref(locale, `/classement/${competition.slug}`),
    unlocalizedPath: `/classement/${competition.slug}`,
    locale,
    seoStatus: competition.seoStatus,
  });
}

export default async function StandingsPage({ params }: PageProps) {
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const data = await loadStandingsPageData(slug);
  if (!data) notFound();
  const { competition, standings, teams } = data;
  const byId = new Map(teams.map((t) => [t.id, t]));
  const cols = dict.standingsPage.columns;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{dict.standingsPage.title} — {competition.name}</h1>

      {standings.length === 0 ? (
        <EmptyState message={dict.standingsPage.noStandings} />
      ) : (
        <div className="overflow-x-auto rounded-xl2 border border-white/10">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wider text-white/50">
              <tr>
                <th className="px-3 py-2">{cols.position}</th>
                <th className="px-3 py-2">{cols.team}</th>
                <th className="px-3 py-2 text-center">{cols.played}</th>
                <th className="px-3 py-2 text-center">{cols.wins}</th>
                <th className="px-3 py-2 text-center">{cols.draws}</th>
                <th className="px-3 py-2 text-center">{cols.losses}</th>
                <th className="px-3 py-2 text-center">{cols.goalsFor}</th>
                <th className="px-3 py-2 text-center">{cols.goalsAgainst}</th>
                <th className="px-3 py-2 text-center">{cols.goalDifference}</th>
                <th className="px-3 py-2 text-center font-bold">{cols.points}</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s) => (
                <tr key={s.teamId} className="border-t border-white/5">
                  <td className="px-3 py-2">{s.position}</td>
                  <td className="px-3 py-2 font-medium">{byId.get(s.teamId)?.name ?? dict.matchCard.unknownTeam}</td>
                  <td className="px-3 py-2 text-center">{s.played}</td>
                  <td className="px-3 py-2 text-center">{s.wins}</td>
                  <td className="px-3 py-2 text-center">{s.draws}</td>
                  <td className="px-3 py-2 text-center">{s.losses}</td>
                  <td className="px-3 py-2 text-center">{s.goalsFor}</td>
                  <td className="px-3 py-2 text-center">{s.goalsAgainst}</td>
                  <td className="px-3 py-2 text-center">{s.goalDifference}</td>
                  <td className="px-3 py-2 text-center font-bold">{s.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
