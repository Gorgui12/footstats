import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { seoConfig } from "@/config/seo-config";

export const metadata: Metadata = {
  title: seoConfig.defaultTitle,
  description: seoConfig.defaultDescription,
  metadataBase: new URL(seoConfig.siteUrl),
  manifest: "/manifest.json",
  openGraph: {
    title: seoConfig.defaultTitle,
    description: seoConfig.defaultDescription,
    siteName: seoConfig.siteName,
    locale: seoConfig.defaultLocale,
    type: "website",
  },
};

export const viewport = {
  themeColor: "#0a1f14",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Header />
        <main className="container-app py-6">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
