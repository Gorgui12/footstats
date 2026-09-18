import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCompetitionBySlug, getStandings } from "@/services/football/competition-service";
import { repositories } from "@/db/repositories";
import { ensureSynced } from "@/services/football/sync-service";
import { EmptyState } from "@/components/ui/states";
import { buildMetadata } from "@/lib/seo";
import { SeoStatus } from "@/domain/football/enums";

interface PageProps {
  params: Promise<{ slug: string }>;
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
  const { slug } = await params;
  const data = await loadStandingsPageData(slug);
  if (!data) {
    return buildMetadata({
      title: "Classement introuvable",
      description: "Ce classement n'existe pas ou n'est plus disponible.",
      path: `/classement/${slug}`,
      seoStatus: SeoStatus.NOINDEX,
    });
  }
  const { competition } = data;
  return buildMetadata({
    title: `Classement — ${competition.name}`,
    description: `Classement complet de ${competition.name} sur FootStats Africa.`,
    path: `/classement/${competition.slug}`,
    seoStatus: competition.seoStatus,
  });
}

export default async function StandingsPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await loadStandingsPageData(slug);
  if (!data) notFound();
  const { competition, standings, teams } = data;
  const byId = new Map(teams.map((t) => [t.id, t]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Classement — {competition.name}</h1>

      {standings.length === 0 ? (
        <EmptyState message="Aucun classement disponible pour cette compétition." />
      ) : (
        <div className="overflow-x-auto rounded-xl2 border border-white/10">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wider text-white/50">
              <tr>
                <th className="px-3 py-2">Pos</th>
                <th className="px-3 py-2">Équipe</th>
                <th className="px-3 py-2 text-center">MJ</th>
                <th className="px-3 py-2 text-center">V</th>
                <th className="px-3 py-2 text-center">N</th>
                <th className="px-3 py-2 text-center">D</th>
                <th className="px-3 py-2 text-center">BP</th>
                <th className="px-3 py-2 text-center">BC</th>
                <th className="px-3 py-2 text-center">Diff</th>
                <th className="px-3 py-2 text-center font-bold">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s) => (
                <tr key={s.teamId} className="border-t border-white/5">
                  <td className="px-3 py-2">{s.position}</td>
                  <td className="px-3 py-2 font-medium">{byId.get(s.teamId)?.name ?? "Équipe inconnue"}</td>
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
