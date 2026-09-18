import type { FootballProvider } from "@/providers/football/football-provider.interface";
import { MockFootballProvider } from "@/providers/football/mock/mock-football-provider";
import { ApiFootballDataProvider } from "@/providers/football/api-football-data/api-football-data-provider";
import { CompositeFootballProvider } from "@/providers/football/composite/composite-football-provider";

/**
 * Point d'entrée unique pour obtenir le provider football actif.
 * Aucun autre fichier ne doit importer un provider concret directement —
 * cela garantit qu'un changement de fournisseur (ARCHITECTURE.md §3) se
 * fait ici et nulle part ailleurs.
 *
 * "football-data" combine football-data.org (grandes compétitions
 * européennes/internationales, plan gratuit) et le mock provider (Ligue 1
 * Sénégal / CAN, faute de source réelle africaine disponible pour le
 * moment — voir DECISIONS.md D9 et composite-football-provider.ts pour le
 * raisonnement complet). Les données mock restent marquées DEMO, jamais
 * confondues avec du réel.
 */
let cachedProvider: FootballProvider | null = null;

export function getFootballProvider(): FootballProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = process.env.FOOTBALL_PROVIDER ?? "mock";

  switch (providerName) {
    case "mock":
      cachedProvider = new MockFootballProvider();
      break;
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
