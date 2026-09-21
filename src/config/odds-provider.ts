import type { OddsProvider } from "@/providers/odds/odds-provider.interface";
import { NotConfiguredOddsProvider } from "@/providers/odds/odds-provider.interface";

/**
 * Même principe que config/football-provider.ts : point d'entrée unique.
 * Aujourd'hui, aucun partenaire n'est configuré — voir DECISIONS.md D10.
 * Le jour où un bookmaker est identifié, son implémentation se branche
 * ici, sans toucher aux pages qui consomment déjà ce service.
 */
let cachedProvider: OddsProvider | null = null;

export function getOddsProvider(): OddsProvider {
  if (!cachedProvider) {
    cachedProvider = new NotConfiguredOddsProvider();
  }
  return cachedProvider;
}
