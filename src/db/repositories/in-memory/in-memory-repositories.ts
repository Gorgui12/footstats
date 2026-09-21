import type { Competition, Match, Player, Standing, Team } from "@/domain/football/types";
import type {
  CompetitionRepository,
  MatchRepository,
  PlayerRepository,
  StandingRepository,
  TeamRepository,
} from "../interfaces";

/**
 * Implémentation en mémoire — chemin de lecture unique (rapide) ; la
 * durabilité est assurée par un write-through vers SQLite (src/db/sqlite.ts)
 * branché via `onPersist`, et par la réhydratation au démarrage via
 * `seed()` (voir repositories/index.ts et DECISIONS.md D14). Respecte
 * exactement les interfaces de `interfaces.ts`, donc remplaçable par une
 * implémentation Postgres sans changer un seul appelant.
 */

export type EntityPersister = (id: string, payload: unknown) => void;

export class InMemoryTeamRepository implements TeamRepository {
  private readonly byId = new Map<string, Team>();

  constructor(private readonly onPersist: EntityPersister = () => {}) {}

  seed(teams: Team[]): void {
    for (const team of teams) this.byId.set(team.id, team);
  }

  async upsert(team: Team): Promise<void> {
    this.byId.set(team.id, team);
    this.onPersist(team.id, team);
  }
  async findById(id: string): Promise<Team | null> {
    return this.byId.get(id) ?? null;
  }
  async findBySlug(slug: string): Promise<Team | null> {
    return [...this.byId.values()].find((t) => t.slug === slug) ?? null;
  }
  async findByCountry(countryId: string): Promise<Team[]> {
    return [...this.byId.values()].filter((t) => t.countryId === countryId);
  }
  async all(): Promise<Team[]> {
    return [...this.byId.values()];
  }
}

export class InMemoryPlayerRepository implements PlayerRepository {
  private readonly byId = new Map<string, Player>();

  constructor(private readonly onPersist: EntityPersister = () => {}) {}

  seed(players: Player[]): void {
    for (const player of players) this.byId.set(player.id, player);
  }

  async upsert(player: Player): Promise<void> {
    this.byId.set(player.id, player);
    this.onPersist(player.id, player);
  }
  async findById(id: string): Promise<Player | null> {
    return this.byId.get(id) ?? null;
  }
  async findBySlug(slug: string): Promise<Player | null> {
    return [...this.byId.values()].find((p) => p.slug === slug) ?? null;
  }
  async findByTeam(teamId: string): Promise<Player[]> {
    return [...this.byId.values()].filter((p) => p.currentTeamId === teamId);
  }
  async search(query: string): Promise<Player[]> {
    const q = query.toLowerCase();
    return [...this.byId.values()].filter((p) => p.fullName.toLowerCase().includes(q));
  }
}

export class InMemoryCompetitionRepository implements CompetitionRepository {
  private readonly byId = new Map<string, Competition>();

  constructor(private readonly onPersist: EntityPersister = () => {}) {}

  seed(competitions: Competition[]): void {
    for (const competition of competitions) this.byId.set(competition.id, competition);
  }

  async upsert(competition: Competition): Promise<void> {
    this.byId.set(competition.id, competition);
    this.onPersist(competition.id, competition);
  }
  async findById(id: string): Promise<Competition | null> {
    return this.byId.get(id) ?? null;
  }
  async findBySlug(slug: string): Promise<Competition | null> {
    return [...this.byId.values()].find((c) => c.slug === slug) ?? null;
  }
  async all(): Promise<Competition[]> {
    return [...this.byId.values()];
  }
}

export class InMemoryMatchRepository implements MatchRepository {
  private readonly byId = new Map<string, Match>();

  constructor(private readonly onPersist: EntityPersister = () => {}) {}

  seed(matches: Match[]): void {
    for (const match of matches) this.byId.set(match.id, match);
  }

  async upsert(match: Match): Promise<void> {
    this.byId.set(match.id, match);
    this.onPersist(match.id, match);
  }
  async findById(id: string): Promise<Match | null> {
    return this.byId.get(id) ?? null;
  }
  async findBySlug(slug: string): Promise<Match | null> {
    return [...this.byId.values()].find((m) => m.slug === slug) ?? null;
  }
  async findLive(): Promise<Match[]> {
    return [...this.byId.values()].filter((m) => m.status === "live" || m.status === "halftime");
  }
  async findByCompetition(competitionId: string): Promise<Match[]> {
    return [...this.byId.values()].filter((m) => m.competitionId === competitionId);
  }
  async findUpcoming(limit: number): Promise<Match[]> {
    const now = Date.now();
    return [...this.byId.values()]
      .filter((m) => new Date(m.kickoffAtUtc).getTime() > now)
      .sort((a, b) => new Date(a.kickoffAtUtc).getTime() - new Date(b.kickoffAtUtc).getTime())
      .slice(0, limit);
  }
  async findRecent(limit: number): Promise<Match[]> {
    const now = Date.now();
    return [...this.byId.values()]
      .filter((m) => new Date(m.kickoffAtUtc).getTime() <= now && m.status === "finished")
      .sort((a, b) => new Date(b.kickoffAtUtc).getTime() - new Date(a.kickoffAtUtc).getTime())
      .slice(0, limit);
  }
  async all(): Promise<Match[]> {
    return [...this.byId.values()];
  }
}

export class InMemoryStandingRepository implements StandingRepository {
  private readonly byKey = new Map<string, Standing>();

  constructor(private readonly onPersist: EntityPersister = () => {}) {}

  private key(s: Pick<Standing, "competitionId" | "seasonId" | "teamId">): string {
    return `${s.competitionId}:${s.seasonId}:${s.teamId}`;
  }

  seed(standings: Standing[]): void {
    for (const s of standings) {
      this.byKey.set(this.key(s), s);
    }
  }

  async upsertMany(standings: Standing[]): Promise<void> {
    for (const s of standings) {
      const key = this.key(s);
      this.byKey.set(key, s);
      this.onPersist(key, s);
    }
  }
  async findByCompetitionAndSeason(competitionId: string, seasonId: string): Promise<Standing[]> {
    return [...this.byKey.values()]
      .filter((s) => s.competitionId === competitionId && s.seasonId === seasonId)
      .sort((a, b) => a.position - b.position);
  }
}
