import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";
import type { DatabaseSync } from "node:sqlite";

/**
 * Persistance SQLite des données football synchronisées (voir
 * DECISIONS.md D14). Utilise `node:sqlite` (module natif Node.js >= 22.5) :
 * aucune dépendance npm native à compiler.
 *
 * Principe : une table `entities` clé/valeur JSON par entité (kind + id),
 * réhydratée dans les repositories en mémoire au démarrage du serveur. Le
 * repository mémoire reste l'unique chemin de lecture (rapide) ; SQLite ne
 * sert que de support durable (write-through à chaque upsert) et de
 * cache de dernier `lastSyncedAt` pour ne pas re-frapper l'API après un
 * redémarrage.
 *
 * Dégradation douce : si `node:sqlite` est indisponible (Node < 22.5) ou
 * si le fichier ne peut pas être ouvert/écrit, la persistance est
 * désactivée silencieusement et l'application retombe sur le comportement
 * mémoire d'origine.
 */

export type EntityKind = "teams" | "players" | "competitions" | "matches" | "standings";

const LAST_SYNCED_AT_KEY = "football:last_synced_at";

const nodeRequire = createRequire(__filename);

function loadSqliteModule(): { DatabaseSync: new (path: string) => DatabaseSync } | null {
  try {
    return nodeRequire("node:sqlite") as { DatabaseSync: new (path: string) => DatabaseSync };
  } catch {
    return null;
  }
}

function getDbPath(): string {
  return process.env.SQLITE_PATH ?? join(process.cwd(), "data", "footstats.db");
}

let connection: DatabaseSync | null = null;
let warned = false;

function openDb(): DatabaseSync | null {
  if (connection !== null) return connection;

  try {
    const sqliteModule = loadSqliteModule();
    if (!sqliteModule) {
      if (!warned) {
        console.warn("[sqlite] node:sqlite indisponible (Node >= 22.5 requis) : persistance désactivée.");
        warned = true;
      }
      return null;
    }

    mkdirSync(dirname(getDbPath()), { recursive: true });
    const db = new sqliteModule.DatabaseSync(getDbPath());
    // WAL + busy_timeout : `next build` ouvre la base depuis plusieurs
    // workers simultanément — sans ça, un ouvrage concurrent échouerait en
    // "database is locked" et désactiverait la persistance à tort.
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA busy_timeout = 5000;");
    db.exec(`
      CREATE TABLE IF NOT EXISTS entities (
        kind TEXT NOT NULL,
        id TEXT NOT NULL,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (kind, id)
      );
      CREATE INDEX IF NOT EXISTS idx_entities_kind ON entities (kind);
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    connection = db;
    return db;
  } catch (error) {
    // Échec possiblement transitoire (verrou, autre worker) : on retente au
    // prochain appel au lieu de désactiver définitivement la persistance.
    if (!warned) {
      console.error("[sqlite] échec d'ouverture de la base, persistance désactivée (nouvel essai au prochain accès) :", error);
      warned = true;
    }
    return null;
  }
}

/** Recharge toutes les entités persistées d'un type donné (au démarrage). */
export function loadEntities<T>(kind: EntityKind): T[] {
  const db = openDb();
  if (!db) return [];
  try {
    const rows = db.prepare("SELECT payload FROM entities WHERE kind = ? ORDER BY id").all(kind) as Array<{
      payload: string;
    }>;
    return rows.map((row) => JSON.parse(row.payload) as T);
  } catch (error) {
    console.error(`[sqlite] lecture "${kind}" échouée :`, error);
    return [];
  }
}

/** Écriture write-through : appelée à chaque upsert d'un repository. */
export function persistEntity(kind: EntityKind, id: string, payload: unknown): void {
  const db = openDb();
  if (!db) return;
  try {
    db.prepare(
      `INSERT INTO entities (kind, id, payload, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT (kind, id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
    ).run(kind, id, JSON.stringify(payload), new Date().toISOString());
  } catch (error) {
    console.error(`[sqlite] écriture "${kind}:${id}" échouée :`, error);
  }
}

export function getLastSyncedAt(): number {
  const db = openDb();
  if (!db) return 0;
  try {
    const row = db.prepare("SELECT value FROM meta WHERE key = ?").get(LAST_SYNCED_AT_KEY) as
      | { value: string }
      | undefined;
    const value = row ? Number(row.value) : NaN;
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch (error) {
    console.error("[sqlite] lecture de last_synced_at échouée :", error);
    return 0;
  }
}

export function setLastSyncedAt(timestamp: number): void {
  const db = openDb();
  if (!db) return;
  try {
    db.prepare(
      `INSERT INTO meta (key, value) VALUES (?, ?)
       ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
    ).run(LAST_SYNCED_AT_KEY, String(timestamp));
  } catch (error) {
    console.error("[sqlite] écriture de last_synced_at échouée :", error);
  }
}

export function isPersistenceAvailable(): boolean {
  return openDb() !== null;
}