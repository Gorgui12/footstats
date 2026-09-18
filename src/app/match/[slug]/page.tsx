import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMatchBySlug, getMatchEvents, getMatchStatistics } from "@/services/football/match-service";
import { repositories } from "@/db/repositories";
import { ensureSynced } from "@/services/football/sync-service";
import { buildMetadata, breadcrumbJsonLd, sportsEventJsonLd } from "@/lib/seo";
import { formatLocalDate, formatLocalTime } from "@/lib/timezone";
import { Badge } from "@/components/ui/badge";
import { FreshnessNote } from "@/components/ui/states";
import { MatchStatus, SeoStatus } from "@/domain/football/enums";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadMatchPageData(slug: string) {
  await ensureSynced();
  const match = await getMatchBySlug(slug);
  if (!match) return null;

  const [homeTeam, awayTeam, competition, events, statistics] = await Promise.all([
    repositories.teams.findById(match.homeTeamId),
    repositories.teams.findById(match.awayTeamId),
    repositories.competitions.findById(match.competitionId),
    getMatchEvents(match.id),
    getMatchStatistics(match.id),
  ]);

  return { match, homeTeam, awayTeam, competition, events, statistics };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadMatchPageData(slug);
  if (!data) {
    return buildMetadata({
      title: "Match introuvable",
      description: "Ce match n'existe pas ou n'est plus disponible.",
      path: `/match/${slug}`,
      seoStatus: SeoStatus.NOINDEX,
    });
  }

  const { match, homeTeam, awayTeam } = data;
  const title = `${homeTeam?.name ?? "?"} vs ${awayTeam?.name ?? "?"}`;
  return buildMetadata({
    title,
    description: `Suivez ${title} : score, composition, statistiques et diffusion sur FootStats Africa.`,
    path: `/match/${match.slug}`,
    seoStatus: match.seoStatus,
  });
}

function statusLabel(status: MatchStatus): string {
  switch (status) {
    case MatchStatus.SCHEDULED:
      return "À venir";
    case MatchStatus.LIVE:
      return "En direct";
    case MatchStatus.HALFTIME:
      return "Mi-temps";
    case MatchStatus.FINISHED:
      return "Terminé";
    case MatchStatus.POSTPONED:
      return "Reporté";
    case MatchStatus.CANCELLED:
      return "Annulé";
    case MatchStatus.AFTER_EXTRA_TIME:
      return "Terminé (prolongations)";
    case MatchStatus.AFTER_PENALTIES:
      return "Terminé (tirs au but)";
    default:
      return status;
  }
}

export default async function MatchPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await loadMatchPageData(slug);
  if (!data) notFound();

  const { match, homeTeam, awayTeam, competition, events, statistics } = data;
  const hasScore = match.homeScore !== null && match.awayScore !== null;

  const breadcrumb = breadcrumbJsonLd([
    { name: "Accueil", url: "/" },
    { name: competition?.name ?? "Compétition", url: `/competitions/${competition?.slug ?? ""}` },
    { name: `${homeTeam?.name} vs ${awayTeam?.name}`, url: `/match/${match.slug}` },
  ]);

  const sportsEvent = sportsEventJsonLd({
    name: `${homeTeam?.name} vs ${awayTeam?.name}`,
    startDateUtc: match.kickoffAtUtc,
    homeTeamName: homeTeam?.name ?? "Équipe",
    awayTeamName: awayTeam?.name ?? "Équipe",
    url: `/match/${match.slug}`,
  });

  return (
    <div className="space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sportsEvent) }} />

      <nav className="text-xs text-white/50">
        <span>{competition?.name ?? "Compétition"}</span>
        <span className="mx-1">/</span>
        <span>{formatLocalDate(match.kickoffAtUtc, "SN")}</span>
      </nav>

      <div className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-6 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <Badge variant={match.status === MatchStatus.LIVE ? "live" : "neutral"}>
            {statusLabel(match.status)}
          </Badge>
        </div>
        <div className="grid grid-cols-3 items-center gap-4">
          <div className="text-right font-semibold">{homeTeam?.name ?? "Équipe inconnue"}</div>
          <div className="font-mono text-3xl font-bold">
            {hasScore ? `${match.homeScore} - ${match.awayScore}` : formatLocalTime(match.kickoffAtUtc, "SN")}
          </div>
          <div className="text-left font-semibold">{awayTeam?.name ?? "Équipe inconnue"}</div>
        </div>
        <p className="mt-3 text-sm text-white/50">
          {formatLocalDate(match.kickoffAtUtc, "SN")} — {formatLocalTime(match.kickoffAtUtc, "SN")} (heure du Sénégal)
        </p>
        <FreshnessNote lastSyncedAt={match.lastSyncedAt} freshness={match.dataFreshness} />
      </div>

      <div className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-white/60">Diffusion</h2>
        <p className="text-white/70">Information non disponible.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">Événements</h2>
          {events.length === 0 ? (
            <p className="text-sm text-white/50">Aucun événement enregistré pour ce match.</p>
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
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">Statistiques</h2>
          {statistics.length === 0 ? (
            <p className="text-sm text-white/50">Aucune statistique disponible pour ce match.</p>
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
    </div>
  );
}
