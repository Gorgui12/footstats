import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { unlinkSync, writeFileSync } from "node:fs";

/**
 * Vérifie le store SQLite (src/db/sqlite.ts) : write-through, upsert,
 * réhydratation et meta lastSyncedAt. Chaque test re-importe le module
 * avec un fichier de base vierge (vi.resetModules + SQLITE_PATH dédié).
 */

let dbPath = "";

beforeEach(() => {
  dbPath = join(tmpdir(), `footstats-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
  process.env.SQLITE_PATH = dbPath;
  vi.resetModules();
});

afterEach(() => {
  try {
    unlinkSync(dbPath);
  } catch {
    // le fichier n'existe pas toujours (tests en mémoire dégradés)
  }
});

describe("src/db/sqlite", () => {
  it("persiste puis recharge une entité (réhydratation)", async () => {
    const sqlite = await import("./sqlite");
    sqlite.persistEntity("teams", "provider:1", { id: "provider:1", name: "Dakar SC" });

    const loaded = sqlite.loadEntities<{ id: string; name: string }>("teams");
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toEqual({ id: "provider:1", name: "Dakar SC" });
  });

  it("upsert : la même id est écrasée, pas dupliquée", async () => {
    const sqlite = await import("./sqlite");
    sqlite.persistEntity("matches", "m1", { id: "m1", score: 1 });
    sqlite.persistEntity("matches", "m1", { id: "m1", score: 3 });

    const loaded = sqlite.loadEntities<{ id: string; score: number }>("matches");
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toEqual({ id: "m1", score: 3 });
  });

  it("sépare les entités par type (kind)", async () => {
    const sqlite = await import("./sqlite");
    sqlite.persistEntity("competitions", "c1", { id: "c1" });
    sqlite.persistEntity("players", "p1", { id: "p1" });

    expect(sqlite.loadEntities("competitions")).toHaveLength(1);
    expect(sqlite.loadEntities("players")).toHaveLength(1);
    expect(sqlite.loadEntities("matches")).toHaveLength(0);
  });

  it("mémorise lastSyncedAt pour le throttle du sync-service", async () => {
    const sqlite = await import("./sqlite");
    expect(sqlite.getLastSyncedAt()).toBe(0);

    const ts = 1_700_000_000_000;
    sqlite.setLastSyncedAt(ts);
    expect(sqlite.getLastSyncedAt()).toBe(ts);

    sqlite.setLastSyncedAt(ts + 45_000);
    expect(sqlite.getLastSyncedAt()).toBe(ts + 45_000);
  });

  it("se dégrade en mémoire lorsque la base ne peut pas être ouverte", async () => {
    // Chemin dont le parent est un fichier, pas un répertoire : la création
    // du dossier échoue sur toutes les plateformes.
    const blocker = join(tmpdir(), `footstats-blocker-${Date.now()}.txt`);
    writeFileSync(blocker, "x");
    process.env.SQLITE_PATH = join(blocker, "db.sqlite");
    const sqlite = await import("./sqlite");

    try {
      // Degradation : retours vides et no-op sans exception.
      expect(sqlite.isPersistenceAvailable()).toBe(false);
      expect(() => sqlite.persistEntity("teams", "t1", { id: "t1" })).not.toThrow();
      expect(sqlite.loadEntities("teams")).toEqual([]);
      expect(sqlite.getLastSyncedAt()).toBe(0);
    } finally {
      unlinkSync(blocker);
    }
  });
});