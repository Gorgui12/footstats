import type { FootballProvider } from "@/providers/football/football-provider.interface";
import { MockFootballProvider } from "@/providers/football/mock/mock-football-provider";
import { ApiFootballDataProvider } from "@/providers/football/api-football-data/api-football-data-provider";
import { ApiFootballProvider } from "@/providers/football/api-football/api-football-provider";
import { CompositeFootballProvider } from "@/providers/football/composite/composite-football-provider";

/**
 * Point d'entrée unique pour obtenir le provider football actif.
 * Aucun autre fichier ne doit importer un provider concret directement —
 * cela garantit qu'un changement de fournisseur (ARCHITECTURE.md §3) se
 * fait ici et nulle part ailleurs.
 *
 * - "football-data" combine football-data.org (grandes compétitions
 *   européennes/internationales, plan gratuit) et le mock provider (Ligue 1
 *   Sénégal / CAN, faute de source réelle africaine — voir DECISIONS.md D9).
 * - "api-football" est le provider API-FOOTBALL (api-sports), source réelle
 *   de la CAN et des championnats locaux africains (listés dans
 *   providers/football/api-football/leagues.ts). Les données sont réelles,
 *   jamais marquées DEMO — voir DECISIONS.md D13.
 */
let cachedProvider: FootballProvider | null = null;

export function getFootballProvider(): FootballProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = process.env.FOOTBALL_PROVIDER ?? "mock";

  switch (providerName) {
    case "mock":
      cachedProvider = new MockFootballProvider();
      break;
    case "api-football": {
      const apiKey = process.env.APIFOOTBALL_API_KEY;
      if (!apiKey) {
        console.warn("[football-provider] APIFOOTBALL_API_KEY manquant, repli sur le mock provider.");
        cachedProvider = new MockFootballProvider();
        break;
      }
      cachedProvider = new ApiFootballProvider({ apiKey });
      break;
    }
    case "football-data": {
      const apiKey = process.env.FOOTBALL_API_KEY;
      if (!apiKey) {
        console.warn("[football-provider] FOOTBALL_API_KEY manquant, repli sur le mock provider.");
        cachedProvider = new MockFootballProvider();
        break;
      }
      cachedProvider = new CompositeFootballProvider([
        new ApiFootballDataProvider({ apiKey }),
        new MockFootballProvider(),
      ]);
      break;
    }
    default:
      console.warn(
        `[football-provider] Fournisseur "${providerName}" inconnu, repli sur le mock provider.`,
      );
      cachedProvider = new MockFootballProvider();
  }

  return cachedProvider;
}
