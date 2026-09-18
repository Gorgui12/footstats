import type { Metadata } from "next";
import { seoConfig } from "@/config/seo-config";
import { SeoStatus } from "@/domain/football/enums";

interface BuildMetadataParams {
  title: string;
  description: string;
  path: string;
  seoStatus: SeoStatus;
  imageUrl?: string | null;
}

/**
 * Construit les metadata Next.js pour une page dépendant de données.
 * Applique noindex automatiquement si le contenu n'est pas jugé suffisant
 * (brief §28 — ne jamais indexer des pages pauvres).
 */
export function buildMetadata({
  title,
  description,
  path,
  seoStatus,
  imageUrl,
}: BuildMetadataParams): Metadata {
  const url = `${seoConfig.siteUrl}${path}`;
  const shouldIndex = seoStatus === SeoStatus.INDEXABLE;

  return {
    title: `${title} | ${seoConfig.siteName}`,
    description,
    alternates: { canonical: url },
    robots: {
      index: shouldIndex,
      follow: shouldIndex,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: seoConfig.siteName,
      locale: seoConfig.defaultLocale,
      type: "website",
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      site: seoConfig.twitterHandle,
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${seoConfig.siteUrl}${item.url}`,
    })),
  };
}

export function sportsEventJsonLd(params: {
  name: string;
  startDateUtc: string;
  homeTeamName: string;
  awayTeamName: string;
  venueName?: string | null;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: params.name,
    startDate: params.startDateUtc,
    url: `${seoConfig.siteUrl}${params.url}`,
    location: params.venueName
      ? { "@type": "Place", name: params.venueName }
      : undefined,
    competitor: [
      { "@type": "SportsTeam", name: params.homeTeamName },
      { "@type": "SportsTeam", name: params.awayTeamName },
    ],
  };
}
