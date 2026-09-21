import type { Country } from "@/domain/football/types";

/**
 * Registre central des pays. Toute logique dépendant du pays doit lire ce
 * registre — jamais de `if (country === "senegal")` dispersé dans le code
 * (cf. ARCHITECTURE.md §4 et brief §17).
 *
 * `isLaunched` distingue les pays réellement actifs en production des pays
 * préparés pour une expansion future (Phase F de ROADMAP.md).
 */
export interface CountryConfig extends Country {
  isLaunched: boolean;
}

export const COUNTRIES: Record<string, CountryConfig> = {
  SN: {
    id: "SN",
    code: "SN",
    name: "Sénégal",
    timezone: "Africa/Dakar",
    currency: "XOF",
    defaultLanguage: "fr",
    isLaunched: true,
  },
  CI: {
    id: "CI",
    code: "CI",
    name: "Côte d'Ivoire",
    timezone: "Africa/Abidjan",
    currency: "XOF",
    defaultLanguage: "fr",
    isLaunched: true,
  },
  ML: {
    id: "ML",
    code: "ML",
    name: "Mali",
    timezone: "Africa/Bamako",
    currency: "XOF",
    defaultLanguage: "fr",
    isLaunched: true,
  },
  BF: {
    id: "BF",
    code: "BF",
    name: "Burkina Faso",
    timezone: "Africa/Ouagadougou",
    currency: "XOF",
    defaultLanguage: "fr",
    isLaunched: false,
  },
  GN: {
    id: "GN",
    code: "GN",
    name: "Guinée",
    timezone: "Africa/Conakry",
    currency: "GNF",
    defaultLanguage: "fr",
    isLaunched: false,
  },
  BJ: {
    id: "BJ",
    code: "BJ",
    name: "Bénin",
    timezone: "Africa/Porto-Novo",
    currency: "XOF",
    defaultLanguage: "fr",
    isLaunched: false,
  },
  TG: {
    id: "TG",
    code: "TG",
    name: "Togo",
    timezone: "Africa/Lome",
    currency: "XOF",
    defaultLanguage: "fr",
    isLaunched: false,
  },
  NG: {
    id: "NG",
    code: "NG",
    name: "Nigeria",
    timezone: "Africa/Lagos",
    currency: "NGN",
    defaultLanguage: "en",
    isLaunched: false,
  },
  GH: {
    id: "GH",
    code: "GH",
    name: "Ghana",
    timezone: "Africa/Accra",
    currency: "GHS",
    defaultLanguage: "en",
    isLaunched: false,
  },
  KE: {
    id: "KE",
    code: "KE",
    name: "Kenya",
    timezone: "Africa/Nairobi",
    currency: "KES",
    defaultLanguage: "en",
    isLaunched: false,
  },
  ZA: {
    id: "ZA",
    code: "ZA",
    name: "Afrique du Sud",
    timezone: "Africa/Johannesburg",
    currency: "ZAR",
    defaultLanguage: "en",
    isLaunched: false,
  },
  MA: {
    id: "MA",
    code: "MA",
    name: "Maroc",
    timezone: "Africa/Casablanca",
    currency: "MAD",
    defaultLanguage: "fr",
    isLaunched: false,
  },
  // Pays des équipes couvertes par football-data.org (grandes compétitions
  // européennes/internationales) — nécessaires pour un affichage correct
  // du pays d'une équipe réelle (ex. Real Madrid, Chelsea), pas des cibles
  // de lancement (isLaunched: false). Clés alignées sur les codes zone
  // (area.code) renvoyés par football-data.org.
  ENG: { id: "ENG", code: "ENG", name: "Angleterre", timezone: "Europe/London", currency: "GBP", defaultLanguage: "en", isLaunched: false },
  ESP: { id: "ESP", code: "ESP", name: "Espagne", timezone: "Europe/Madrid", currency: "EUR", defaultLanguage: "es", isLaunched: false },
  GER: { id: "GER", code: "GER", name: "Allemagne", timezone: "Europe/Berlin", currency: "EUR", defaultLanguage: "de", isLaunched: false },
  ITA: { id: "ITA", code: "ITA", name: "Italie", timezone: "Europe/Rome", currency: "EUR", defaultLanguage: "it", isLaunched: false },
  FRA: { id: "FRA", code: "FRA", name: "France", timezone: "Europe/Paris", currency: "EUR", defaultLanguage: "fr", isLaunched: false },
  NED: { id: "NED", code: "NED", name: "Pays-Bas", timezone: "Europe/Amsterdam", currency: "EUR", defaultLanguage: "nl", isLaunched: false },
  POR: { id: "POR", code: "POR", name: "Portugal", timezone: "Europe/Lisbon", currency: "EUR", defaultLanguage: "pt", isLaunched: false },
  BRA: { id: "BRA", code: "BRA", name: "Brésil", timezone: "America/Sao_Paulo", currency: "BRL", defaultLanguage: "pt", isLaunched: false },
};

export const DEFAULT_COUNTRY_CODE = "SN";

/**
 * Retourne la configuration d'un pays. Si le code n'est pas dans le
 * registre (équipe d'un pays non encore modélisé), on renvoie un repli
 * générique basé sur le code brut plutôt que le Sénégal par défaut — un
 * ancien bug renvoyait silencieusement "Sénégal" pour tout code inconnu,
 * ce qui affichait un pays erroné (ex. le Maroc ou l'Espagne apparaissant
 * comme "Sénégal" sur une page équipe).
 */
export function getCountry(code: string): CountryConfig {
  const found = COUNTRIES[code];
  if (found) return found;
  return {
    id: code,
    code,
    name: code,
    timezone: "UTC",
    currency: "",
    defaultLanguage: "en",
    isLaunched: false,
  };
}

export function getLaunchedCountries(): CountryConfig[] {
  return Object.values(COUNTRIES).filter((c) => c.isLaunched);
}
