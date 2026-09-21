import { getOddsProvider } from "@/config/odds-provider";
import type { OddsQuote } from "@/domain/affiliate/types";

/**
 * Point d'accès unique pour les pages : ne retourne jamais de donnée
 * inventée. Tant qu'aucun partenaire n'est configuré (DECISIONS.md D10),
 * retourne toujours un tableau vide — les pages doivent donc gérer ce cas
 * en n'affichant simplement rien (pas de "Information non disponible" qui
 * suggérerait qu'une offre est censée exister).
 */
export async function getOddsForMatch(matchId: string): Promise<OddsQuote[]> {
  const provider = getOddsProvider();
  return provider.getOddsForMatch(matchId);
}
