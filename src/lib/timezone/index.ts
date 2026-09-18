import { getCountry } from "@/config/countries";

/**
 * Convertit un datetime UTC (tel que stocké en base) vers l'heure locale
 * d'un pays donné. Ne jamais coder une timezone en dur dans un composant —
 * toujours passer par le pays de l'utilisateur (brief §16).
 */
export function formatLocalTime(
  isoUtc: string,
  countryCode: string,
  options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" },
): string {
  const country = getCountry(countryCode);
  return new Intl.DateTimeFormat("fr-FR", {
    ...options,
    timeZone: country.timezone,
  }).format(new Date(isoUtc));
}

export function formatLocalDate(
  isoUtc: string,
  countryCode: string,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "long", year: "numeric" },
): string {
  const country = getCountry(countryCode);
  return new Intl.DateTimeFormat("fr-FR", {
    ...options,
    timeZone: country.timezone,
  }).format(new Date(isoUtc));
}

export function isSameLocalDay(isoUtcA: string, isoUtcB: string, countryCode: string): boolean {
  const country = getCountry(countryCode);
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: country.timezone });
  return fmt.format(new Date(isoUtcA)) === fmt.format(new Date(isoUtcB));
}

export function isToday(isoUtc: string, countryCode: string): boolean {
  return isSameLocalDay(isoUtc, new Date().toISOString(), countryCode);
}
