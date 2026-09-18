interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Cache TTL générique + déduplication ("in-flight") : si deux appels
 * concurrents demandent la même clé avant qu'une réponse soit arrivée, le
 * second réutilise la promesse du premier au lieu de déclencher un second
 * appel réseau. Essentiel pour un fournisseur à quota strict comme
 * football-data.org (10 req/min en gratuit) où `Promise.all` peut
 * déclencher plusieurs appels simultanés vers la même ressource pendant la
 * synchronisation (brief §88 — maîtriser les coûts par appel).
 */
export class TtlCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly inFlight = new Map<string, Promise<unknown>>();

  async getOrFetch<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const cached = this.store.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.value as T;
    }

    const pending = this.inFlight.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    const promise = fetcher()
      .then((value) => {
        this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
        this.inFlight.delete(key);
        return value;
      })
      .catch((error) => {
        this.inFlight.delete(key);
        throw error;
      });

    this.inFlight.set(key, promise);
    return promise;
  }
}
