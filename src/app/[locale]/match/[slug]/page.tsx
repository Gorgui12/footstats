import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMatchBySlug, getMatchEvents, getMatchStatistics } from "@/services/football/match-service";
import { getOddsForMatch } from "@/services/affiliate/odds-service";
import { repositories } from "@/db/repositories";
import { ensureSynced } from "@/services/football/sync-service";
import { getPreferredCountryCode } from "@/services/users/country-preference-service";
import { buildMetadata, breadcrumbJsonLd, sportsEventJsonLd } from "@/lib/seo";
import { formatLocalDate, formatLocalTime } from "@/lib/timezone";
import { getCountry } from "@/config/countries";
import { Badge } from "@/components/ui/badge";
import { FreshnessNote } from "@/components/ui/states";
import { MatchStatus, SeoStatus } from "@/domain/football/enums";
import { isSupportedLocale, localizedHref, DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import type { Dictionary } from "@/i18n/dictionaries/types";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

async function loadMatchPageData(slug: string) {
  await ensureSynced();
  const match = await getMatchBySlug(slug);
  if (!match) return null;

  const [homeTeam, awayTeam, competition, events, statistics, odds] = await Promise.all([
    repositories.teams.findById(match.homeTeamId),
    repositories.teams.findById(match.awayTeamId),
    repositories.competitions.findById(match.competitionId),
    getMatchEvents(match.id),
    getMatchStatistics(match.id),
    getOddsForMatch(match.id),
  ]);

  return { match, homeTeam, awayTeam, competition, events, statistics, odds };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const data = await loadMatchPageData(slug);
  if (!data) {
    return buildMetadata({
      title: dict.matchPage.notFoundTitle,
      description: dict.matchPage.notFoundDescription,
      path: localizedHref(locale, `/match/${slug}`),
      unlocalizedPath: `/match/${slug}`,
      locale,
      seoStatus: SeoStatus.NOINDEX,
    });
  }

  const { match, homeTeam, awayTeam } = data;
  const title = `${homeTeam?.name ?? "?"} vs ${awayTeam?.name ?? "?"}`;
  const description =
    locale === "en"
      ? `Follow ${title}: score, lineups, statistics and broadcast on FootStats Africa.`
      : `Suivez ${title} : score, composition, statistiques et diffusion sur FootStats Africa.`;
  return buildMetadata({
    title,
    description,
    path: localizedHref(locale, `/match/${match.slug}`),
    unlocalizedPath: `/match/${match.slug}`,
    locale,
    seoStatus: match.seoStatus,
  });
}

function statusLabel(status: MatchStatus, dict: Dictionary): string {
  switch (status) {
    case MatchStatus.SCHEDULED:
      return dict.matchPage.statusUpcoming;
    case MatchStatus.LIVE:
      return dict.matchPage.statusLive;
    case MatchStatus.HALFTIME:
      return dict.matchPage.statusHalftime;
    case MatchStatus.FINISHED:
      return dict.matchPage.statusFinished;
    case MatchStatus.POSTPONED:
      return dict.matchPage.statusPostponed;
    case MatchStatus.CANCELLED:
      return dict.matchPage.statusCancelled;
    case MatchStatus.AFTER_EXTRA_TIME:
      return dict.matchPage.statusAfterExtraTime;
    case MatchStatus.AFTER_PENALTIES:
      return dict.matchPage.statusAfterPenalties;
    default:
      return status;
  }
}

export default async function MatchPage({ params }: PageProps) {
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const countryCode = await getPreferredCountryCode();
  const country = getCountry(countryCode);

  const data = await loadMatchPageData(slug);
  if (!data) notFound();

  const { match, homeTeam, awayTeam, competition, events, statistics, odds } = data;
  const hasScore = match.homeScore !== null && match.awayScore !== null;

  const breadcrumb = breadcrumbJsonLd([
    { name: dict.nav.home, url: localizedHref(locale, "/") },
    { name: competition?.name ?? "", url: localizedHref(locale, `/competitions/${competition?.slug ?? ""}`) },
    { name: `${homeTeam?.name} vs ${awayTeam?.name}`, url: localizedHref(locale, `/match/${match.slug}`) },
  ]);

  const sportsEvent = sportsEventJsonLd({
    name: `${homeTeam?.name} vs ${awayTeam?.name}`,
    startDateUtc: match.kickoffAtUtc,
    homeTeamName: homeTeam?.name ?? dict.matchCard.unknownTeam,
    awayTeamName: awayTeam?.name ?? dict.matchCard.unknownTeam,
    url: localizedHref(locale, `/match/${match.slug}`),
  });

  return (
    <div className="space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sportsEvent) }} />

      <nav className="text-xs text-white/50">
        <span>{competition?.name ?? ""}</span>
        <span className="mx-1">/</span>
        <span>{formatLocalDate(match.kickoffAtUtc, countryCode)}</span>
      </nav>

      <div className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-6 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <Badge variant={match.status === MatchStatus.LIVE ? "live" : "neutral"}>
            {statusLabel(match.status, dict)}
          </Badge>
        </div>
        <div className="grid grid-cols-3 items-center gap-4">
          <div className="text-right font-semibold">{homeTeam?.name ?? dict.matchCard.unknownTeam}</div>
          <div className="font-mono text-3xl font-bold">
            {hasScore ? `${match.homeScore} - ${match.awayScore}` : formatLocalTime(match.kickoffAtUtc, countryCode)}
          </div>
          <div className="text-left font-semibold">{awayTeam?.name ?? dict.matchCard.unknownTeam}</div>
        </div>
        <p className="mt-3 text-sm text-white/50">
          {formatLocalDate(match.kickoffAtUtc, countryCode)} — {formatLocalTime(match.kickoffAtUtc, countryCode)} ({dict.matchPage.atCountryTime} {country.name})
        </p>
        <FreshnessNote lastSyncedAt={match.lastSyncedAt} freshness={match.dataFreshness} dict={dict} />
      </div>

      <div className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-white/60">{dict.matchPage.broadcast}</h2>
        <p className="text-white/70">{dict.matchPage.infoUnavailable}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">{dict.matchPage.events}</h2>
          {events.length === 0 ? (
            <p className="text-sm text-white/50">{dict.matchPage.noEvents}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {events.map((e) => (
                <li key={e.id} className="flex items-center gap-2">
                  <span className="w-8 font-mono text-white/50">{e.minute}&apos;</span>
                  <span>{e.type}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">{dict.matchPage.statistics}</h2>
          {statistics.length === 0 ? (
            <p className="text-sm text-white/50">{dict.matchPage.noStatistics}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {statistics.map((s, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-white/60">{s.key}</span>
                  <span className="font-mono">{s.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/*
        Niveau 3 (cotes) : la section ne s'affiche que si un partenaire est
        réellement configuré (odds.length > 0). Tant que
        NotConfiguredOddsProvider est actif (DECISIONS.md D10), `odds` est
        toujours vide et rien ne s'affiche ici — c'est volontaire, pour ne
        jamais suggérer une offre qui n'existe pas.
      */}
      {odds.length > 0 && (
        <div className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">
            {locale === "en" ? "Odds" : "Cotes"}
          </h2>
          <ul className="space-y-2 text-sm">
            {odds.map((o, i) => (
              <li key={i} className="flex items-center justify-between">
                <span className="text-white/60">{o.partnerName} — {o.market} / {o.outcome}</span>
                <span className="font-mono">{o.odds}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
