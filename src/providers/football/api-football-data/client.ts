import { TtlCache } from "@/lib/utils/ttl-cache";
import { SlidingWindowRateLimiter } from "@/lib/utils/rate-limiter";

const BASE_URL = "https://api.football-data.org/v4";

// Le plan gratuit annonce 10 requêtes/minute. On se garde une marge (8)
// pour ne jamais déclencher de 429 même en cas de rafale au démarrage
// (plusieurs services appelés en parallèle via Promise.all).
const rateLimiter = new SlidingWindowRateLimiter(8, 60_000);
const cache = new TtlCache();

export class FootballDataHttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "FootballDataHttpError";
  }
}

async function rawFetch(path: string, apiKey: string): Promise<unknown> {
  await rateLimiter.acquire();
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "X-Auth-Token": apiKey },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new FootballDataHttpError(response.status, `football-data.org a répondu ${response.status} sur ${path}`);
  }

  return response.json();
}

/**
 * Point d'entrée unique pour appeler football-data.org. Le TTL est fourni
 * par l'appelant (mapper/provider) selon la volatilité de la ressource :
 * courte pour les matchs (scores en direct), longue pour les compétitions
 * et les classements (ARCHITECTURE.md §7).
 */
export async function fetchFootballData<T>(path: string, apiKey: string, ttlMs: number): Promise<T> {
  return cache.getOrFetch<T>(`football-data:${path}`, ttlMs, () => rawFetch(path, apiKey) as Promise<T>);
}
