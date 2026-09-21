import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { SeoStatus } from "@/domain/football/enums";
import { isSupportedLocale, localizedHref, DEFAULT_LOCALE, type Locale } from "@/i18n/config";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const CONTENT = {
  fr: {
    title: "Contact",
    body: "Une adresse de contact sera publiée ici avant la mise en production publique du site.",
  },
  en: {
    title: "Contact",
    body: "A contact address will be published here before the site's public launch.",
  },
} as const;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const content = CONTENT[locale];
  return buildMetadata({
    title: content.title,
    description: content.body,
    path: localizedHref(locale, "/contact"),
    seoStatus: SeoStatus.NOINDEX,
  });
}

export default async function ContactPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const content = CONTENT[locale];

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{content.title}</h1>
      <p className="text-white/70">{content.body}</p>
    </div>
  );
}
