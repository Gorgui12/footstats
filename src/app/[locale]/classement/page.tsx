import type { Metadata } from "next";
import Link from "next/link";
import { getAllCompetitions } from "@/services/football/competition-service";
import { ensureSynced } from "@/services/football/sync-service";
import { buildMetadata } from "@/lib/seo";
import { SeoStatus } from "@/domain/football/enums";
import { EmptyState } from "@/components/ui/states";
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
    title: locale === "en" ? "Standings" : "Classements",
    description:
      locale === "en"
        ? "League standings for every competition tracked by FootStats Africa."
        : "Classements de toutes les compétitions suivies par FootStats Africa.",
    path: localizedHref(locale, "/classement"),
    unlocalizedPath: "/classement",
    locale,
    seoStatus: SeoStatus.INDEXABLE,
  });
}

export default async function StandingsIndexPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  await ensureSynced();
  const competitions = await getAllCompetitions();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{dict.nav.standings}</h1>
      {competitions.length === 0 ? (
        <EmptyState message={locale === "en" ? "No competition available yet." : "Aucune compétition disponible pour le moment."} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {competitions.map((c) => (
            <Link
              key={c.id}
              href={localizedHref(locale, `/classement/${c.slug}`)}
              className="rounded-xl2 border border-white/10 bg-pitch-900/60 p-4 hover:border-brand-500/40"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
