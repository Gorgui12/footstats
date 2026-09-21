import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { SeoStatus } from "@/domain/football/enums";
import { isSupportedLocale, localizedHref, DEFAULT_LOCALE, type Locale } from "@/i18n/config";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const CONTENT = {
  fr: {
    title: "À propos",
    body: [
      "FootStats Africa (Project WinMax) est une plateforme de suivi et d'analyse football, pensée en premier lieu pour le Sénégal puis l'Afrique de l'Ouest.",
      "Notre objectif : donner une vraie place éditoriale au football sénégalais et africain — équipes, joueurs, compétitions — aux côtés des grandes compétitions internationales, sans jamais présenter une information non vérifiée comme certaine.",
      "Le produit est en développement actif. Cette page sera complétée à mesure que le projet avance.",
    ],
  },
  en: {
    title: "About",
    body: [
      "FootStats Africa (Project WinMax) is a football tracking and analysis platform, built first for Senegal and then for West Africa.",
      "Our goal is to give Senegalese and African football — teams, players, competitions — real editorial space alongside major international competitions, without ever presenting unverified information as fact.",
      "The product is under active development. This page will be completed as the project progresses.",
    ],
  },
} as const;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const content = CONTENT[locale];
  return buildMetadata({
    title: content.title,
    description: content.body[0],
    path: localizedHref(locale, "/a-propos"),
    seoStatus: SeoStatus.INDEXABLE,
  });
}

export default async function AboutPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const content = CONTENT[locale];

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{content.title}</h1>
      {content.body.map((p, i) => (
        <p key={i} className="text-white/70">{p}</p>
      ))}
    </div>
  );
}
