import type { MetadataRoute } from "next";
import { seoConfig } from "@/config/seo-config";
import { getAllTeams } from "@/services/football/team-service";
import { getAllCompetitions } from "@/services/football/competition-service";
import { getAllMatches } from "@/services/football/match-service";
import { SeoStatus } from "@/domain/football/enums";
import { SUPPORTED_LOCALES, localizedHref } from "@/i18n/config";

// Le sitemap dépend des données du sync-service (provider à quota) : on
// empêche sa génération pendant `next build`, où il déclencherait des
// appels réseau réels sans données encore synchronisées.
export const dynamic = "force-dynamic";

/**
 * Une entrée par langue pour chaque chemin indexable (brief §27/§28), avec
 * les alternates hreflang pointant vers les autres langues — cohérent avec
 * lib/seo/index.ts (buildMetadata) qui génère les mêmes alternates au
 * niveau de chaque page.
 */
function entriesForPath(
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
): MetadataRoute.Sitemap {
  return SUPPORTED_LOCALES.map((locale) => ({
    url: `${seoConfig.siteUrl}${localizedHref(locale, path)}`,
    changeFrequency,
    priority,
    alternates: {
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map((l) => [l, `${seoConfig.siteUrl}${localizedHref(l, path)}`]),
      ),
    },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [teams, competitions, matches] = await Promise.all([
    getAllTeams(),
    getAllCompetitions(),
    getAllMatches(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    ...entriesForPath("/", "always", 1),
    ...entriesForPath("/matchs", "always", 0.9),
    ...entriesForPath("/competitions", "daily", 0.8),
  ];

  const teamEntries: MetadataRoute.Sitemap = teams
    .filter((t) => t.seoStatus === SeoStatus.INDEXABLE)
    .flatMap((t) => entriesForPath(`/equipes/${t.slug}`, "daily", 0.6));

  const competitionEntries: MetadataRoute.Sitemap = competitions
    .filter((c) => c.seoStatus === SeoStatus.INDEXABLE)
    .flatMap((c) => entriesForPath(`/competitions/${c.slug}`, "daily", 0.7));

  const matchEntries: MetadataRoute.Sitemap = matches
    .filter((m) => m.seoStatus === SeoStatus.INDEXABLE)
    .flatMap((m) => entriesForPath(`/match/${m.slug}`, "hourly", 0.5));

  return [...staticEntries, ...teamEntries, ...competitionEntries, ...matchEntries];
}
