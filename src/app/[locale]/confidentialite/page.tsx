import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { SeoStatus } from "@/domain/football/enums";
import { isSupportedLocale, localizedHref, DEFAULT_LOCALE, type Locale } from "@/i18n/config";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const CONTENT = {
  fr: {
    title: "Confidentialité",
    body: [
      "FootStats Africa utilise trois cookies techniques : un identifiant léger pour retenir vos favoris (aucune inscription requise), votre préférence de pays d'affichage, et votre préférence de langue.",
      "Aucune donnée n'est vendue ni partagée avec des tiers publicitaires. Cette page sera complétée avec une politique de confidentialité détaillée avant la mise en production publique du site.",
    ],
  },
  en: {
    title: "Privacy",
    body: [
      "FootStats Africa uses three technical cookies: a lightweight identifier to remember your favorites (no sign-up required), your preferred display country, and your preferred language.",
      "No data is sold or shared with advertising third parties. This page will be completed with a detailed privacy policy before the site's public launch.",
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
    path: localizedHref(locale, "/confidentialite"),
    seoStatus: SeoStatus.NOINDEX,
  });
}

export default async function PrivacyPage({ params }: PageProps) {
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
