import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { FreshnessNote } from "@/components/ui/states";
import type { Match, Team } from "@/domain/football/types";
import { MatchStatus } from "@/domain/football/enums";
import { formatLocalTime } from "@/lib/timezone";
import { localizedHref, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/types";

interface MatchCardProps {
  match: Match;
  homeTeam: Team | null;
  awayTeam: Team | null;
  locale: Locale;
  dict: Dictionary;
  countryCode: string;
}

function statusBadge(match: Match, dict: Dictionary) {
  if (match.status === MatchStatus.LIVE || match.status === MatchStatus.HALFTIME) {
    return (
      <Badge variant="live">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live" />
        {match.status === MatchStatus.HALFTIME
          ? dict.matchCard.halftime
          : match.minute !== null
            ? `${match.minute}'`
            : dict.matchCard.live}
      </Badge>
    );
  }
  if (match.status === MatchStatus.FINISHED) return <Badge variant="neutral">{dict.matchCard.finished}</Badge>;
  if (match.status === MatchStatus.POSTPONED) return <Badge variant="outline">{dict.matchCard.postponed}</Badge>;
  if (match.status === MatchStatus.CANCELLED) return <Badge variant="outline">{dict.matchCard.cancelled}</Badge>;
  return null;
}

export function MatchCard({ match, homeTeam, awayTeam, locale, dict, countryCode }: MatchCardProps) {
  const hasScore = match.homeScore !== null && match.awayScore !== null;

  return (
    <Link
      href={localizedHref(locale, `/match/${match.slug}`)}
      className="block rounded-xl2 border border-white/10 bg-pitch-900/60 p-4 transition hover:border-brand-500/40 hover:bg-pitch-900"
    >
      <div className="mb-3 flex items-center justify-between">
        {statusBadge(match, dict)}
        <span className="text-xs text-white/50">{formatLocalTime(match.kickoffAtUtc, countryCode)}</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">{homeTeam?.name ?? dict.matchCard.unknownTeam}</span>
          {hasScore && <span className="font-mono font-semibold">{match.homeScore}</span>}
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">{awayTeam?.name ?? dict.matchCard.unknownTeam}</span>
          {hasScore && <span className="font-mono font-semibold">{match.awayScore}</span>}
        </div>
      </div>
      <FreshnessNote lastSyncedAt={match.lastSyncedAt} freshness={match.dataFreshness} dict={dict} />
    </Link>
  );
}
