import type { MetadataRoute } from "next";
import { seoConfig } from "@/config/seo-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/recherche"],
    },
    sitemap: `${seoConfig.siteUrl}/sitemap.xml`,
  };
}
