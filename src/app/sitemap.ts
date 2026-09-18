import type { MetadataRoute } from "next";
import { seoConfig } from "@/config/seo-config";
import { getAllTeams } from "@/services/football/team-service";
import { getAllCompetitions } from "@/services/football/competition-service";
import { getAllMatches } from "@/services/football/match-service";
import { SeoStatus } from "@/domain/football/enums";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [teams, competitions, matches] = await Promise.all([
    getAllTeams(),
    getAllCompetitions(),
    getAllMatches(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${seoConfig.siteUrl}/`, changeFrequency: "always", priority: 1 },
    { url: `${seoConfig.siteUrl}/matchs`, changeFrequency: "always", priority: 0.9 },
    { url: `${seoConfig.siteUrl}/competitions`, changeFrequency: "daily", priority: 0.8 },
  ];

  const teamEntries: MetadataRoute.Sitemap = teams
    .filter((t) => t.seoStatus === SeoStatus.INDEXABLE)
    .map((t) => ({ url: `${seoConfig.siteUrl}/equipes/${t.slug}`, changeFrequency: "daily", priority: 0.6 }));

  const competitionEntries: MetadataRoute.Sitemap = competitions
    .filter((c) => c.seoStatus === SeoStatus.INDEXABLE)
    .map((c) => ({ url: `${seoConfig.siteUrl}/competitions/${c.slug}`, changeFrequency: "daily", priority: 0.7 }));

  const matchEntries: MetadataRoute.Sitemap = matches
    .filter((m) => m.seoStatus === SeoStatus.INDEXABLE)
    .map((m) => ({ url: `${seoConfig.siteUrl}/match/${m.slug}`, changeFrequency: "hourly", priority: 0.5 }));

  return [...staticEntries, ...teamEntries, ...competitionEntries, ...matchEntries];
}
