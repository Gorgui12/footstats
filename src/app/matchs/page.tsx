import type { Metadata } from "next";
import { MatchCard } from "@/components/football/match-card";
import { SectionHeader } from "@/components/football/section-header";
import { EmptyState } from "@/components/ui/states";
import { getAllMatches } from "@/services/football/match-service";
import { repositories } from "@/db/repositories";
import { ensureSynced } from "@/services/football/sync-service";
import { buildMetadata } from "@/lib/seo";
import { SeoStatus } from "@/domain/football/enums";
import { isToday } from "@/lib/timezone";

export const metadata: Metadata = buildMetadata({
  title: "Tous les matchs",
  description: "Calendrier, matchs du jour et résultats du football sénégalais et africain.",
  path: "/matchs",
  seoStatus: SeoStatus.INDEXABLE,
});

export default async function MatchsPage() {
  await ensureSynced();
  const matches = await getAllMatches();
  const teams = await repositories.teams.all();
  const byId = new Map(teams.map((t) => [t.id, t]));

  const todayMatches = matches.filter((m) => isToday(m.kickoffAtUtc, "SN"));
  const otherMatches = matches.filter((m) => !isToday(m.kickoffAtUtc, "SN"));

  return (
    <div className="space-y-10">
      <section>
        <SectionHeader title="Aujourd'hui" />
        {todayMatches.length === 0 ? (
          <EmptyState message="Aucun match aujourd'hui." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {todayMatches.map((m) => (
              <MatchCard key={m.id} match={m} homeTeam={byId.get(m.homeTeamId) ?? null} awayTeam={byId.get(m.awayTeamId) ?? null} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Autres matchs" />
        {otherMatches.length === 0 ? (
          <EmptyState message="Aucun autre match programmé pour le moment." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherMatches.map((m) => (
              <MatchCard key={m.id} match={m} homeTeam={byId.get(m.homeTeamId) ?? null} awayTeam={byId.get(m.awayTeamId) ?? null} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
