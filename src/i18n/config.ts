/**
 * Multi-langue réel (brief §18, Niveau 4). Le français reste la langue
 * par défaut (marché de lancement), l'anglais est la première extension
 * (Afrique anglophone — Nigeria, Ghana, Kenya, Afrique du Sud, cf.
 * ROADMAP.md Phase F). Le portugais pourra s'ajouter de la même façon
 * (nouveau fichier dictionnaire + entrée dans SUPPORTED_LOCALES) sans
 * toucher au reste du code.
 */
export const SUPPORTED_LOCALES = ["fr", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Construit un chemin préfixé par la langue (ex: "/matchs" → "/fr/matchs"). */
export function localizedHref(locale: Locale, path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${cleanPath === "/" ? "" : cleanPath}`;
}
