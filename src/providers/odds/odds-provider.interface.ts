import type { OddsQuote } from "@/domain/affiliate/types";

/**
 * Abstraction pour une source de cotes/codes promo — même principe que
 * FootballProvider (ARCHITECTURE.md §3) : le reste de l'application ne
 * dépend que de cette interface, jamais d'un partenaire ou d'une méthode
 * d'obtention (API officielle vs scraping) concrète.
 *
 * ⚠️ Aucune implémentation "scraper" n'est branchée pour le moment. Un
 * scraper ciblant un bookmaker précis doit :
 *  1. Respecter les conditions d'utilisation / robots.txt du site cible.
 *  2. Être fait pour UN site nommé — un scraper "générique" n'a pas de
 *     sens (chaque site a sa propre structure HTML), donc chaque
 *     implémentation vit dans son propre dossier (ex.
 *     providers/odds/<nom-du-bookmaker>/).
 *  3. S'accompagner des garde-fous du brief (§83) avant toute mise en
 *     production : mentions légales, restrictions géographiques, pas de
 *     promesse de gain, séparation stricte de l'expérience football
 *     (§41 — l'affiliation ne doit jamais contaminer le code football).
 *
 * Voir DECISIONS.md D10.
 */
export interface OddsProvider {
  readonly partnerId: string;
  getOddsForMatch(matchId: string): Promise<OddsQuote[]>;
}

/**
 * Provider par défaut tant qu'aucun partenaire n'est configuré. Ne
 * retourne jamais de donnée inventée — un tableau vide, pas une cote
 * simulée présentée comme réelle (brief §97).
 */
export class NotConfiguredOddsProvider implements OddsProvider {
  readonly partnerId = "none";

  async getOddsForMatch(_matchId: string): Promise<OddsQuote[]> {
    return [];
  }
}
