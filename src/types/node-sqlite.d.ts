/**
 * Types minimaux pour `node:sqlite` (module natif Node.js >= 22.5).
 *
 * @types/node 20 (installé) ne déclare pas encore ce module : on fournit
 * ici la sous-partie utilisée par src/db/sqlite.ts, sans dépendre d'une
 * mise à jour de @types/node ni d'un paquet natif à compiler (better-sqlite3).
 */
declare module "node:sqlite" {
  export interface StatementSync {
    run(...anonymousParameters: unknown[]): {
      changes: number | bigint;
      lastInsertRowid: number | bigint;
    };
    get(...anonymousParameters: unknown[]): Record<string, unknown> | undefined;
    all(...anonymousParameters: unknown[]): Record<string, unknown>[];
  }

  export interface DatabaseSync {
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }

  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}