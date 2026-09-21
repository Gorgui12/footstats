import { TtlCache } from "@/lib/utils/ttl-cache";
import { SlidingWindowRateLimiter } from "@/lib/utils/rate-limiter";

const BASE_URL = "https://v3.football.api-sports.io";

/**
 * Le vrai plafond API-FOOTBALL est le quota QUOTIDIEN (100 req/j sur le
 * plan Free — en-têtes x-ratelimit-requests-*). Le limiteur ne fait que
 * lisser la cadence pour ne pas déclencher de 429 sur le plafond par
 * minute (le plan Free annonce 10/min ; on se garde une marge pour les
 * Promise.all du sync-service).
 *
 * ⚠️ En dev, Next.js re-charge les modules à chaud : un limiteur/cache au
 * niveau module serait recréé à chaque reload (plusieurs instances en
 * parallèle → le budget par minute éclate, comme vu avec
 * "limit of requests per minute"). On stocke donc l'état sur
 * `globalThis` pour que toutes les instances du même process partagent le
 * même budget. En complément, une erreur de quota déclenche un retry avec
 * backoff (rawFetch) au lieu de faire planter la page.
 */
type ApiFootballGlobalState = {
  __apiFootballRateLimiter?: SlidingWindowRateLimiter;
  __apiFootballCache?: TtlCache;
};

const globalState = globalThis as ApiFootballGlobalState;
const rateLimiter = (globalState.__apiFootballRateLimiter ??= new SlidingWindowRateLimiter(9, 60_000));
const cache = (globalState.__apiFootballCache ??= new TtlCache());

export class ApiFootballHttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiFootballHttpError";
  }
}

/** Erreur transitoire de quota (429 ou "Too many requests" dans le corps) :
 * doit être rejouée avec backoff par rawFetch, pas propagée au caller. */
export class ApiFootballTooManyRequestsError extends ApiFootballHttpError {
  readonly retryAfterMs: number | null;

  constructor(status: number, message: string, retryAfterMs: number | null = null) {
    super(status, message);
    this.name = "ApiFootballTooManyRequestsError";
    this.retryAfterMs = retryAfterMs;
  }
}

const RATE_LIMIT_RETRIES = 4;
const RATE_LIMIT_BACKOFF_BASE_MS = 1_000;

function isRateLimitBody(errors: unknown): boolean {
  if (!errors) return false;
  if (Array.isArray(errors)) return errors.length > 0;
  const entries = Object.entries(errors as Record<string, unknown>);
  return entries.some(([key, value]) => {
    const message = String(value ?? "").toLowerCase();
    return /rate|request/i.test(key) && /too many|limit/i.test(message);
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function attemptFetch(path: string, apiKey: string, attempt: number): Promise<unknown> {
  await rateLimiter.acquire();

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "x-apisports-key": apiKey },
    cache: "no-store",
  });

  const json = (await response.json().catch(() => null)) as { errors?: unknown[] | Record<string, string> } | null;
  const errors = json?.errors;
  const hasBodyErrors = Boolean(errors && (Array.isArray(errors) ? errors.length > 0 : Object.keys(errors).length > 0));

  // La limite "par minute" est annoncée en HTTP 429 (Retry-After possible)
  // ou directement dans le corps (errors.rateLimit) avec un statut 200.
  if (response.status === 429 || (hasBodyErrors && isRateLimitBody(errors))) {
    const retryAfterMs = Number(response.headers.get("retry-after")) ? Number(response.headers.get("retry-after")) * 1000 : null;
    throw new ApiFootballTooManyRequestsError(
      response.status,
      `api-football: quota par minute atteint sur ${path} (essai ${attempt + 1})`,
      retryAfterMs,
    );
  }

  if (!response.ok) {
    throw new ApiFootballHttpError(response.status, `api-football a répondu ${response.status} sur ${path}`);
  }

  // API-FOOTBALL expose d'autres erreurs applicatives dans le corps (ex.
  // quota quotidien atteint, paramètre invalide) : les convertir en
  // exception plutôt que de les laisser remonter comme réponse valide et
  // vider nos repositories.
  if (hasBodyErrors) {
    throw new ApiFootballHttpError(response.status, `api-football: ${JSON.stringify(errors)}`);
  }

  return json;
}

async function rawFetch(path: string, apiKey: string): Promise<unknown> {
  let lastError: ApiFootballHttpError | null = null;

  for (let attempt = 0; attempt <= RATE_LIMIT_RETRIES; attempt++) {
    try {
      return await attemptFetch(path, apiKey, attempt);
    } catch (error) {
      if (error instanceof ApiFootballTooManyRequestsError) {
        lastError = error;
        const waitMs = Math.max(
          error.retryAfterMs ?? 0,
          RATE_LIMIT_BACKOFF_BASE_MS * 2 ** attempt,
        );
        await sleep(waitMs);
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new ApiFootballHttpError(0, `api-football: quota par minute persistant sur ${path}`);
}

/**
 * Point d'entrée unique pour appeler API-FOOTBALL. Le TTL est fourni par
 * l'appelant (provider) selon la volatilité de la ressource : court pour
 * les matchs/scores live, long pour les compétitions et les équipes
 * (ARCHITECTURE.md §7). Le cache déduplique aussi les appels concurrents
 * vers la même ressource (voir lib/utils/ttl-cache.ts).
 */
export function fetchApiFootball<T>(path: string, apiKey: string, ttlMs: number): Promise<T> {
  return cache.getOrFetch<T>(`api-football:${path}`, ttlMs, () => rawFetch(path, apiKey) as Promise<T>);
}