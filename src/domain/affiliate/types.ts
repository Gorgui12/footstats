/**
 * Domaine affiliation/cotes — correspond aux tables préparées dans
 * schema.sql (AffiliatePartner, AffiliateCampaign, AffiliateClick).
 * Reste strictement séparé du domaine football (brief §41-43) : rien ici
 * n'est importé par domain/football ou par les pages de contenu football.
 */

export interface AffiliatePartner {
  id: string;
  name: string;
  isActive: boolean;
  disclosureText: string | null;
  allowedCountries: string[];
}

export interface OddsQuote {
  partnerId: string;
  partnerName: string;
  matchId: string;
  market: string; // ex: "1X2", "over_under_2_5"
  outcome: string; // ex: "home", "draw", "away"
  odds: number;
  promoCode: string | null;
  fetchedAt: string;
  /**
   * Une cote n'est jamais affichée sans cette information : d'où elle
   * vient et depuis quand elle est valable (brief §53/§82 — ne jamais
   * présenter une donnée non vérifiée comme certaine).
   */
  sourceUrl: string | null;
}
