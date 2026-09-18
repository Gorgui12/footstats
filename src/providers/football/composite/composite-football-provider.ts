import type {
  FootballProvider,
  MatchQuery,
  PlayerQuery,
  RawCompetition,
  RawEvent,
  RawLineup,
  RawMatch,
  RawPlayer,
  RawStanding,
  RawStatistic,
  RawTeam,
  TeamQuery,
} from "../football-provider.interface";

/**
 * Combine plusieurs FootballProvider en un seul, vu comme un provider
 * unique par le reste de l'application (ARCHITECTURE.md §3 — le choix du
 * fournisseur reste centralisé et transparent pour les services).
 *
 * Cas d'usage actuel : football-data.org couvre les grandes compétitions
 * européennes/internationales, mais aucune compétition sénégalaise ou
 * africaine (plan gratuit). Plutôt que de faire disparaître Ligue 1
 * Sénégal / CAN du produit — contraire au positionnement "Africa-first"
 * (brief §32/§80) — on les fait cohabiter avec le MockFootballProvider,
 * dont les données restent explicitement marquées DEMO (isDemoData: true,
 * donc dataFreshness = "unavailable", jamais confondues avec du réel —
 * voir normalizer.ts). Dès qu'une source réelle africaine est branchée,
 * il suffit de remplacer le MockFootballProvider par elle dans la liste
 * ci-dessous — aucun autre changement requis.
 *
 * Stratégie de résolution :
 * - Méthodes "liste" (getMatches, getTeams, getCompetitions) : fusion des
 *   résultats de tous les providers.
 * - Méthodes "par identifiant" (getMatch, getTeam, getStandings,
 *   getEvents, getStatistics, getLineups, getPlayers) : on essaie chaque
 *   provider dans l'ordre et on retourne le premier résultat non vide.
 *   Les espaces d'identifiants externes ne se chevauchent pas en pratique
 *   (ids numériques football-data.org vs ids préfixés du mock).
 */
export class CompositeFootballProvider implements FootballProvider {
  readonly name = "composite";

  constructor(private readonly providers: FootballProvider[]) {}

  async getMatches(params: MatchQuery): Promise<RawMatch[]> {
    const results = await Promise.all(this.providers.map((p) => p.getMatches(params)));
    return results.flat();
  }

  async getMatch(externalId: string): Promise<RawMatch | null> {
    for (const provider of this.providers) {
      const result = await provider.getMatch(externalId);
      if (result) return result;
    }
    return null;
  }

  async getTeams(params: TeamQuery): Promise<RawTeam[]> {
    const results = await Promise.all(this.providers.map((p) => p.getTeams(params)));
    return results.flat();
  }

  async getTeam(externalId: string): Promise<RawTeam | null> {
    for (const provider of this.providers) {
      const result = await provider.getTeam(externalId);
      if (result) return result;
    }
    return null;
  }

  async getPlayers(params: PlayerQuery): Promise<RawPlayer[]> {
    const results = await Promise.all(this.providers.map((p) => p.getPlayers(params)));
    return results.flat();
  }

  async getCompetitions(): Promise<RawCompetition[]> {
    const results = await Promise.all(this.providers.map((p) => p.getCompetitions()));
    return results.flat();
  }

  async getStandings(competitionExternalId: string, seasonLabel: string): Promise<RawStanding[]> {
    for (const provider of this.providers) {
      const result = await provider.getStandings(competitionExternalId, seasonLabel);
      if (result.length > 0) return result;
    }
    return [];
  }

  async getLineups(matchExternalId: string): Promise<RawLineup[]> {
    for (const provider of this.providers) {
      const result = await provider.getLineups(matchExternalId);
      if (result.length > 0) return result;
    }
    return [];
  }

  async getEvents(matchExternalId: string): Promise<RawEvent[]> {
    for (const provider of this.providers) {
      const result = await provider.getEvents(matchExternalId);
      if (result.length > 0) return result;
    }
    return [];
  }

  async getStatistics(matchExternalId: string): Promise<RawStatistic[]> {
    for (const provider of this.providers) {
      const result = await provider.getStatistics(matchExternalId);
      if (result.length > 0) return result;
    }
    return [];
  }
}
