import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { FreshnessNote } from "@/components/ui/states";
import type { Match, Team } from "@/domain/football/types";
import { MatchStatus } from "@/domain/football/enums";
import { formatLocalTime } from "@/lib/timezone";

interface MatchCardProps {
  match: Match;
  homeTeam: Team | null;
  awayTeam: Team | null;
  countryCode?: string;
}

function statusBadge(match: Match) {
  if (match.status === MatchStatus.LIVE || match.status === MatchStatus.HALFTIME) {
    return (
      <Badge variant="live">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live" />
        {match.status === MatchStatus.HALFTIME ? "Mi-temps" : match.minute !== null ? `${match.minute}'` : "En direct"}
      </Badge>
    );
  }
  if (match.status === MatchStatus.FINISHED) return <Badge variant="neutral">Terminé</Badge>;
  if (match.status === MatchStatus.POSTPONED) return <Badge variant="outline">Reporté</Badge>;
  if (match.status === MatchStatus.CANCELLED) return <Badge variant="outline">Annulé</Badge>;
  return null;
}

export function MatchCard({ match, homeTeam, awayTeam, countryCode = "SN" }: MatchCardProps) {
  const hasScore = match.homeScore !== null && match.awayScore !== null;

  return (
    <Link
      href={`/match/${match.slug}`}
      className="block rounded-xl2 border border-white/10 bg-pitch-900/60 p-4 transition hover:border-brand-500/40 hover:bg-pitch-900"
    >
      <div className="mb-3 flex items-center justify-between">
        {statusBadge(match)}
        <span className="text-xs text-white/50">{formatLocalTime(match.kickoffAtUtc, countryCode)}</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">{homeTeam?.name ?? "Équipe inconnue"}</span>
          {hasScore && <span className="font-mono font-semibold">{match.homeScore}</span>}
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">{awayTeam?.name ?? "Équipe inconnue"}</span>
          {hasScore && <span className="font-mono font-semibold">{match.awayScore}</span>}
        </div>
      </div>
      <FreshnessNote lastSyncedAt={match.lastSyncedAt} freshness={match.dataFreshness} />
    </Link>
  );
}
