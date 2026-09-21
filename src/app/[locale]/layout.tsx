import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { seoConfig } from "@/config/seo-config";
import { SUPPORTED_LOCALES, isSupportedLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const ogLocale = locale === "en" ? "en_US" : "fr_SN";
  return {
    title: seoConfig.defaultTitle,
    description: seoConfig.defaultDescription,
    metadataBase: new URL(seoConfig.siteUrl),
    manifest: "/manifest.json",
    openGraph: {
      title: seoConfig.defaultTitle,
      description: seoConfig.defaultDescription,
      siteName: seoConfig.siteName,
      locale: ogLocale,
      type: "website",
    },
  };
}

export const viewport = {
  themeColor: "#0a1f14",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isSupportedLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const dict = getDictionary(locale);

  return (
    <html lang={locale}>
      <body>
        <Header locale={locale} dict={dict} />
        <main className="container-app py-6">{children}</main>
        <Footer locale={locale} dict={dict} />
      </body>
    </html>
  );
}
