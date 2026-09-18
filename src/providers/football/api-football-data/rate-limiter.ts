/**
 * Limiteur de débit à fenêtre glissante. Utilisé pour ne jamais dépasser
 * le quota d'un fournisseur externe (ex. football-data.org : 10 req/min
 * en plan gratuit). Les appels excédentaires sont mis en attente plutôt
 * que rejetés — acceptable pour des pages semi-statiques avec cache TTL
 * en amont (ARCHITECTURE.md §7).
 */
export class SlidingWindowRateLimiter {
  private timestamps: number[] = [];

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number,
  ) {}

  async acquire(): Promise<void> {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);

    if (this.timestamps.length < this.maxRequests) {
      this.timestamps.push(now);
      return;
    }

    const oldest = this.timestamps[0]!;
    const waitMs = this.windowMs - (now - oldest) + 50;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return this.acquire();
  }
}
