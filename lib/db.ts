import path from "node:path";
import type { ContentItem, Status } from "./types";

const usingPostgres = !!process.env.DATABASE_URL;

// ---------------------------------------------------------------------------
// Two backends behind one interface:
//  - SQLite (better-sqlite3) for local development — zero setup, file-based.
//  - Postgres (pg) for production on Vercel — set DATABASE_URL in project
//    settings (Vercel's Storage tab can provision a Postgres DB directly).
// Switch is automatic: DATABASE_URL present -> Postgres, absent -> SQLite.
// ---------------------------------------------------------------------------

type Row = {
  id: string;
  section: string;
  order_num: number;
  title: string;
  type: string;
  status: string;
  notes: string;
  text: string;
  language: string;
  updated_at: number;
};

function rowToItem(r: Row): ContentItem {
  return {
    id: r.id,
    section: r.section as ContentItem["section"],
    order: r.order_num,
    title: r.title,
    type: r.type,
    status: r.status as Status,
    notes: r.notes,
    text: r.text,
    language: r.language as ContentItem["language"],
    updatedAt: Number(r.updated_at),
  };
}

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS content (
  id TEXT PRIMARY KEY,
  section TEXT NOT NULL,
  order_num INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'drafted',
  notes TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'en',
  updated_at BIGINT NOT NULL DEFAULT 0
);
`;

// ---------------- SQLite backend ----------------
let sqliteDb: import("better-sqlite3").Database | null = null;

function getSqlite() {
  if (sqliteDb) return sqliteDb;
  // require() kept dynamic so this file only touches better-sqlite3 when
  // actually running the SQLite branch (Postgres/production never loads it).
  const Database = require("better-sqlite3");
  const dbPath = path.join(process.cwd(), "data", "dev.db");
  sqliteDb = new Database(dbPath);
  sqliteDb!.exec(CREATE_TABLE_SQL.replace("BIGINT", "INTEGER"));
  return sqliteDb!;
}

// ---------------- Postgres backend ----------------
let pgPool: import("pg").Pool | null = null;

function getPgPool() {
  if (pgPool) return pgPool;
  const { Pool } = require("pg");
  pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pgPool!;
}

async function ensurePgTable() {
  const pool = getPgPool();
  await pool.query(CREATE_TABLE_SQL);
}

let pgReady: Promise<void> | null = null;
function pgReadyOnce() {
  if (!pgReady) pgReady = ensurePgTable();
  return pgReady;
}

// ---------------- Public API ----------------

export async function listContent(section?: string): Promise<ContentItem[]> {
  if (usingPostgres) {
    await pgReadyOnce();
    const pool = getPgPool();
    const res = section
      ? await pool.query(
          "SELECT * FROM content WHERE section = $1 ORDER BY order_num ASC",
          [section]
        )
      : await pool.query("SELECT * FROM content ORDER BY order_num ASC");
    return res.rows.map(rowToItem);
  } else {
    const db = getSqlite();
    const rows = section
      ? db
          .prepare("SELECT * FROM content WHERE section = ? ORDER BY order_num ASC")
          .all(section)
      : db.prepare("SELECT * FROM content ORDER BY order_num ASC").all();
    return (rows as Row[]).map(rowToItem);
  }
}

export async function getContent(id: string): Promise<ContentItem | null> {
  if (usingPostgres) {
    await pgReadyOnce();
    const pool = getPgPool();
    const res = await pool.query("SELECT * FROM content WHERE id = $1", [id]);
    return res.rows[0] ? rowToItem(res.rows[0]) : null;
  } else {
    const db = getSqlite();
    const row = db.prepare("SELECT * FROM content WHERE id = ?").get(id) as
      | Row
      | undefined;
    return row ? rowToItem(row) : null;
  }
}

export async function updateContent(
  id: string,
  patch: Partial<Pick<ContentItem, "title" | "type" | "status" | "notes" | "text">>
): Promise<ContentItem | null> {
  const updatedAt = Date.now();
  const fields = Object.keys(patch);
  if (fields.length === 0) return getContent(id);

  if (usingPostgres) {
    await pgReadyOnce();
    const pool = getPgPool();
    const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).concat([
      `updated_at = $${fields.length + 1}`,
    ]);
    const values = fields.map((f) => (patch as any)[f]).concat([updatedAt]);
    await pool.query(
      `UPDATE content SET ${setClauses.join(", ")} WHERE id = $${fields.length + 2}`,
      [...values, id]
    );
    return getContent(id);
  } else {
    const db = getSqlite();
    const setClauses = fields.map((f) => `${f} = ?`).concat(["updated_at = ?"]);
    const values = fields.map((f) => (patch as any)[f]).concat([updatedAt]);
    db.prepare(`UPDATE content SET ${setClauses.join(", ")} WHERE id = ?`).run(
      ...values,
      id
    );
    return getContent(id);
  }
}

export async function createContent(item: ContentItem): Promise<ContentItem> {
  if (usingPostgres) {
    await pgReadyOnce();
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO content (id, section, order_num, title, type, status, notes, text, language, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO UPDATE SET
         section=$2, order_num=$3, title=$4, type=$5, status=$6, notes=$7, text=$8, language=$9, updated_at=$10`,
      [
        item.id,
        item.section,
        item.order,
        item.title,
        item.type,
        item.status,
        item.notes,
        item.text,
        item.language,
        item.updatedAt,
      ]
    );
  } else {
    const db = getSqlite();
    db.prepare(
      `INSERT INTO content (id, section, order_num, title, type, status, notes, text, language, updated_at)
       VALUES (@id, @section, @order, @title, @type, @status, @notes, @text, @language, @updatedAt)
       ON CONFLICT(id) DO UPDATE SET
         section=excluded.section, order_num=excluded.order_num, title=excluded.title,
         type=excluded.type, status=excluded.status, notes=excluded.notes, text=excluded.text,
         language=excluded.language, updated_at=excluded.updated_at`
    ).run(item);
  }
  return item;
}

export async function statusCounts(): Promise<Record<Status, number>> {
  const items = await listContent();
  const counts: Record<Status, number> = {
    posted: 0,
    drafted: 0,
    needs_facts: 0,
    idea: 0,
  };
  for (const i of items) counts[i.status]++;
  return counts;
}
