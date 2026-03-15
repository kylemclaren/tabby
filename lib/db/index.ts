import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"
import type * as schema from "./schema"
import path from "path"

type DB = BunSQLiteDatabase<typeof schema>

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "tabby.db")

let _db: DB | null = null

async function initDb(): Promise<DB> {
  const { Database } = await import("bun:sqlite")
  const { drizzle } = await import("drizzle-orm/bun-sqlite")
  const s = await import("./schema")

  const sqlite = new Database(DB_PATH, { create: true })
  sqlite.exec("PRAGMA journal_mode = WAL")
  sqlite.exec("PRAGMA foreign_keys = ON")

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS tabs (
      id TEXT PRIMARY KEY,
      chrome_id TEXT,
      url TEXT NOT NULL,
      title TEXT,
      domain TEXT,
      favicon_url TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      type TEXT NOT NULL DEFAULT 'page',
      category TEXT,
      summary TEXT,
      og_image TEXT,
      description TEXT,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      first_seen_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      closed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT,
      icon TEXT,
      is_smart INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tabs_to_groups (
      tab_id TEXT NOT NULL REFERENCES tabs(id) ON DELETE CASCADE,
      group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      PRIMARY KEY (tab_id, group_id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_auto INTEGER NOT NULL DEFAULT 0,
      tab_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session_tabs (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      title TEXT,
      domain TEXT,
      favicon_url TEXT,
      category TEXT,
      position INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_tabs_status ON tabs(status);
    CREATE INDEX IF NOT EXISTS idx_tabs_chrome_id ON tabs(chrome_id);
    CREATE INDEX IF NOT EXISTS idx_tabs_domain ON tabs(domain);
    CREATE INDEX IF NOT EXISTS idx_tabs_category ON tabs(category);
    CREATE INDEX IF NOT EXISTS idx_session_tabs_session_id ON session_tabs(session_id);
  `)

  // Migrations for existing databases
  try {
    sqlite.exec(`ALTER TABLE tabs ADD COLUMN window_id INTEGER`)
  } catch {
    // column already exists
  }

  try {
    sqlite.exec(`ALTER TABLE tabs ADD COLUMN is_article INTEGER`)
  } catch {
    // column already exists
  }

  return drizzle(sqlite, { schema: s })
}

let _initPromise: Promise<DB> | null = null

export async function getDb(): Promise<DB> {
  if (_db) return _db
  if (!_initPromise) _initPromise = initDb()
  _db = await _initPromise
  return _db
}
