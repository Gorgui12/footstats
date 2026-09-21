import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { SeoStatus } from "@/domain/football/enums";
import { isSupportedLocale, localizedHref, DEFAULT_LOCALE, type Locale } from "@/i18n/config";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const CONTENT = {
  fr: {
    title: "Mentions légales",
    body: [
      "Cette page sera complétée avec les informations légales de l'éditeur (raison sociale, adresse, hébergeur) avant la mise en production publique du site.",
      "FootStats Africa n'affiche à ce jour aucune offre de paris sportifs ni aucun partenaire d'affiliation actif. Si cette fonctionnalité est activée à l'avenir, les mentions requises (âge légal, restrictions géographiques, jeu responsable) seront ajoutées ici avant son lancement.",
    ],
  },
  en: {
    title: "Legal notice",
    body: [
      "This page will be completed with the publisher's legal information (company name, address, hosting provider) before the site's public launch.",
      "FootStats Africa does not currently display any betting offers or active affiliate partner. If this feature is enabled in the future, the required disclosures (legal age, geographic restrictions, responsible gambling) will be added here before launch.",
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
    path: localizedHref(locale, "/mentions-legales"),
    seoStatus: SeoStatus.NOINDEX,
  });
}

export default async function LegalNoticePage({ params }: PageProps) {
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
