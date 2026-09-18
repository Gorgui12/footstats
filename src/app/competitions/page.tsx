import type { Metadata } from "next";
import Link from "next/link";
import { getAllCompetitions } from "@/services/football/competition-service";
import { ensureSynced } from "@/services/football/sync-service";
import { buildMetadata } from "@/lib/seo";
import { SeoStatus } from "@/domain/football/enums";
import { EmptyState } from "@/components/ui/states";

export const metadata: Metadata = buildMetadata({
  title: "Compétitions",
  description: "Toutes les compétitions suivies par FootStats Africa.",
  path: "/competitions",
  seoStatus: SeoStatus.INDEXABLE,
});

export default async function CompetitionsPage() {
  await ensureSynced();
  const competitions = await getAllCompetitions();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Compétitions</h1>
      {competitions.length === 0 ? (
        <EmptyState message="Aucune compétition disponible pour le moment." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {competitions.map((c) => (
            <Link
              key={c.id}
              href={`/competitions/${c.slug}`}
              className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-4 hover:border-brand-500/40"
            >
              <p className="font-medium">{c.name}</p>
              <p className="text-xs uppercase tracking-wider text-white/40">{c.type}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
