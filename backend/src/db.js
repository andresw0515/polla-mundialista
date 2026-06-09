import { default as initSqlJs } from "sql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../data/polla.db");
let _db = null;

export async function initDb() {
  const SQL = await initSqlJs();
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const buf = fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH) : null;
  _db = buf ? new SQL.Database(buf) : new SQL.Database();
  _db.run("PRAGMA foreign_keys=ON");
  _db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT DEFAULT '',
    email TEXT UNIQUE NOT NULL, passwordHash TEXT NOT NULL, hasPaid INTEGER DEFAULT 0,
    isActive INTEGER DEFAULT 1, role TEXT DEFAULT 'PARTICIPANT',
    createdAt TEXT DEFAULT (datetime('now'))
  )`);
  _db.run(`CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT, groupName TEXT DEFAULT '', homeTeam TEXT NOT NULL,
    awayTeam TEXT NOT NULL, startTime TEXT NOT NULL, homeScore INTEGER, awayScore INTEGER,
    status TEXT DEFAULT 'SCHEDULED', fifaMatchId TEXT, stageName TEXT DEFAULT '',
    createdAt TEXT DEFAULT (datetime('now'))
  )`);
  try { _db.run("ALTER TABLE matches ADD COLUMN fifaMatchId TEXT"); } catch (e) {}
  try { _db.run("ALTER TABLE matches ADD COLUMN stageName TEXT DEFAULT ''"); } catch (e) {}
  _db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_fifa_id ON matches(fifaMatchId)");
  _db.run(`CREATE TABLE IF NOT EXISTS stages (
    name TEXT PRIMARY KEY, isActive INTEGER DEFAULT 0, closesAt TEXT DEFAULT ''
  )`);
  try { _db.run("ALTER TABLE stages ADD COLUMN closesAt TEXT DEFAULT ''"); } catch (e) {}
  _db.run(`CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL, matchId INTEGER NOT NULL,
    homeScore INTEGER, awayScore INTEGER, points INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')), updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id), FOREIGN KEY (matchId) REFERENCES matches(id),
    UNIQUE(userId, matchId)
  )`);
  save();
}

export function save() {
  if (!_db) return;
  fs.writeFileSync(DB_PATH, Buffer.from(_db.export()));
}

export function get(sql, ...params) {
  const stmt = _db.prepare(sql);
  if (params.length) stmt.bind(params);
  const row = stmt.step() ? stmt.getAsObject() : undefined;
  stmt.free();
  return row;
}

export function all(sql, ...params) {
  const stmt = _db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

export function run(sql, ...params) {
  const stmt = _db.prepare(sql);
  if (params.length) stmt.bind(params);
  stmt.step();
  stmt.free();
}
