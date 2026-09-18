import { CompetitionType } from "@/domain/football/enums";

/**
 * Registre des compétitions mises en avant sur la homepage/navigation.
 * `slug` doit correspondre exactement au slug généré par
 * `normalizeCompetition` (slugify(name) — voir providers/football/normalizer.ts)
 * pour que le lien pointe vers une page réellement peuplée une fois la
 * synchronisation effectuée. `externalCode` documente le code
 * football-data.org correspondant, à titre de référence (non utilisé
 * programmatiquement — le rapprochement se fait par slug).
 *
 * Ligue 1 Sénégal et la CAN restent affichées mais sont actuellement
 * sourcées depuis le mock provider (DEMO) : football-data.org (plan
 * gratuit) ne couvre aucune compétition africaine — voir DECISIONS.md D9.
 */
export interface FeaturedCompetition {
  slug: string;
  name: string;
  type: CompetitionType;
  countryCode: string | null; // null pour les compétitions internationales/continentales
  priority: number; // ordre d'affichage, plus petit = plus haut
  externalCode?: string; // code football-data.org, à titre indicatif
  isDemoSource?: boolean; // true si actuellement sourcée depuis le mock provider
}

export const FEATURED_COMPETITIONS: FeaturedCompetition[] = [
  { slug: "ligue-1-senegal", name: "Ligue 1 Sénégal", type: CompetitionType.LEAGUE, countryCode: "SN", priority: 1, isDemoSource: true },
  { slug: "coupe-dafrique-des-nations", name: "Coupe d'Afrique des Nations", type: CompetitionType.INTERNATIONAL, countryCode: null, priority: 2, isDemoSource: true },
  { slug: "uefa-champions-league", name: "Ligue des Champions UEFA", type: CompetitionType.CUP, countryCode: null, priority: 3, externalCode: "CL" },
  { slug: "premier-league", name: "Premier League", type: CompetitionType.LEAGUE, countryCode: "ENG", priority: 4, externalCode: "PL" },
  { slug: "primera-division", name: "La Liga", type: CompetitionType.LEAGUE, countryCode: "ESP", priority: 5, externalCode: "PD" },
  { slug: "ligue-1", name: "Ligue 1 (France)", type: CompetitionType.LEAGUE, countryCode: "FRA", priority: 6, externalCode: "FL1" },
  { slug: "serie-a", name: "Serie A", type: CompetitionType.LEAGUE, countryCode: "ITA", priority: 7, externalCode: "SA" },
  { slug: "bundesliga", name: "Bundesliga", type: CompetitionType.LEAGUE, countryCode: "GER", priority: 8, externalCode: "BL1" },
  { slug: "fifa-world-cup", name: "Coupe du Monde FIFA", type: CompetitionType.INTERNATIONAL, countryCode: null, priority: 9, externalCode: "WC" },
];

export function getFeaturedCompetitions(): FeaturedCompetition[] {
  return [...FEATURED_COMPETITIONS].sort((a, b) => a.priority - b.priority);
}
