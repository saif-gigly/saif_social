// Seeds the content table from scripts/seed-data.json.
// Run with: npm run seed   (uses SQLite locally, or Postgres if DATABASE_URL is set)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "seed-data.json");
const raw = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

// language: derived from section (Bangla channels vs LinkedIn/English)
const SECTION_LANGUAGE = {
  facebook: "bn",
  linkedin: "en",
  she_came: "bn",
  portraits: "bn",
  hijoltola: "bn",
};

const items = Object.entries(raw).map(([id, v]) => ({
  id,
  section: v.section,
  order: v.order ?? 0,
  title: v.title,
  type: v.type ?? "",
  status: v.status ?? "drafted",
  notes: v.notes ?? "",
  text: v.text ?? "",
  language: SECTION_LANGUAGE[v.section] ?? "en",
  updatedAt: Date.now(),
}));

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

async function seedPostgres() {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(CREATE_TABLE_SQL);
  for (const item of items) {
    await pool.query(
      `INSERT INTO content (id, section, order_num, title, type, status, notes, text, language, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO UPDATE SET
         section=$2, order_num=$3, title=$4, type=$5, status=$6, notes=$7, text=$8, language=$9, updated_at=$10`,
      [
        item.id, item.section, item.order, item.title, item.type,
        item.status, item.notes, item.text, item.language, item.updatedAt,
      ]
    );
  }
  await pool.end();
  console.log(`Seeded ${items.length} items into Postgres.`);
}

async function seedSqlite() {
  const { default: Database } = await import("better-sqlite3");
  const dbPath = path.join(__dirname, "..", "data", "dev.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.exec(CREATE_TABLE_SQL.replace("BIGINT", "INTEGER"));
  const stmt = db.prepare(
    `INSERT INTO content (id, section, order_num, title, type, status, notes, text, language, updated_at)
     VALUES (@id, @section, @order, @title, @type, @status, @notes, @text, @language, @updatedAt)
     ON CONFLICT(id) DO UPDATE SET
       section=excluded.section, order_num=excluded.order_num, title=excluded.title,
       type=excluded.type, status=excluded.status, notes=excluded.notes, text=excluded.text,
       language=excluded.language, updated_at=excluded.updated_at`
  );
  const insertMany = db.transaction((rows) => {
    for (const row of rows) stmt.run(row);
  });
  insertMany(items);
  console.log(`Seeded ${items.length} items into SQLite at ${dbPath}.`);
}

if (process.env.DATABASE_URL) {
  await seedPostgres();
} else {
  await seedSqlite();
}
