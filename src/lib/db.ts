// ============================================================
// peetsuh — SQLite Database (better-sqlite3)
// Singleton pattern — one connection per process
// ============================================================

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "peetsuh.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  // Ensure data directory exists
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  _db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent read performance
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  // Initialize schema
  initSchema(_db);

  return _db;
}

function initSchema(db: Database.Database): void {
  const tableInfo = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='orders'`).get() as any;
  if (tableInfo && !tableInfo.sql.includes('out_for_delivery')) {
    db.exec(`
      PRAGMA foreign_keys=off;
      BEGIN TRANSACTION;
      CREATE TABLE orders_new (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        order_ref   TEXT    NOT NULL UNIQUE,
        channel     TEXT    NOT NULL CHECK(channel IN ('chat', 'shop')),
        status      TEXT    NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'preparing', 'out_for_delivery', 'done', 'cancelled')),
        customer_name    TEXT NOT NULL,
        customer_phone   TEXT NOT NULL,
        customer_address TEXT NOT NULL,
        items_json  TEXT    NOT NULL,
        total       INTEGER NOT NULL,
        created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO orders_new SELECT * FROM orders;
      DROP TABLE orders;
      ALTER TABLE orders_new RENAME TO orders;
      COMMIT;
      PRAGMA foreign_keys=on;
    `);
  }

  db.exec(`
    -- Orders table
    CREATE TABLE IF NOT EXISTS orders (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      order_ref   TEXT    NOT NULL UNIQUE,
      channel     TEXT    NOT NULL CHECK(channel IN ('chat', 'shop')),
      status      TEXT    NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'preparing', 'out_for_delivery', 'done', 'cancelled')),
      customer_name    TEXT NOT NULL,
      customer_phone   TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      items_json  TEXT    NOT NULL,
      total       INTEGER NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- Admin users table
    CREATE TABLE IF NOT EXISTS admin_users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- Rate limiting table (simple in-DB rate limiter)
    CREATE TABLE IF NOT EXISTS rate_limit (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      ip        TEXT NOT NULL,
      endpoint  TEXT NOT NULL,
      hit_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Index for fast order lookups
    CREATE INDEX IF NOT EXISTS idx_orders_created_at  ON orders(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_orders_status      ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_channel     ON orders(channel);
    CREATE INDEX IF NOT EXISTS idx_rate_limit_ip      ON rate_limit(ip, endpoint, hit_at);
  `);
}

// ── Order operations ──────────────────────────────────────────────────────────
export interface DbOrder {
  id: number;
  order_ref: string;
  channel: "chat" | "shop";
  status: "new" | "preparing" | "out_for_delivery" | "done" | "cancelled";
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items_json: string;
  total: number;
  created_at: string;
  updated_at: string;
}

export function insertOrder(data: {
  order_ref: string;
  channel: "chat" | "shop";
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items_json: string;
  total: number;
}): DbOrder {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO orders (order_ref, channel, customer_name, customer_phone, customer_address, items_json, total)
    VALUES (@order_ref, @channel, @customer_name, @customer_phone, @customer_address, @items_json, @total)
    RETURNING *
  `);
  return stmt.get(data) as DbOrder;
}

export function getOrders(limit = 100, offset = 0): DbOrder[] {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(limit, offset) as DbOrder[];
}

export function getOrderByRef(ref: string): DbOrder | undefined {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM orders WHERE order_ref = ?`)
    .get(ref) as DbOrder | undefined;
}

export function updateOrderStatus(
  id: number,
  status: "new" | "preparing" | "out_for_delivery" | "done" | "cancelled"
): void {
  const db = getDb();
  db.prepare(
    `UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(status, id);
}

// ── Admin user operations ─────────────────────────────────────
export function getAdminUser(
  username: string
): { id: number; username: string; password_hash: string } | undefined {
  const db = getDb();
  return db
    .prepare(`SELECT id, username, password_hash FROM admin_users WHERE username = ?`)
    .get(username) as { id: number; username: string; password_hash: string } | undefined;
}

export function createAdminUser(username: string, passwordHash: string): void {
  const db = getDb();
  db.prepare(
    `INSERT OR IGNORE INTO admin_users (username, password_hash) VALUES (?, ?)`
  ).run(username, passwordHash);
}

// ── Simple rate limiter ───────────────────────────────────────
/**
 * Returns true if the IP is rate-limited (too many hits in the window).
 * Cleans old hits as a side effect.
 */
export function isRateLimited(
  ip: string,
  endpoint: string,
  maxHits: number,
  windowSeconds: number
): boolean {
  const db = getDb();

  // Clean old entries
  db.prepare(
    `DELETE FROM rate_limit WHERE ip = ? AND endpoint = ? AND hit_at < datetime('now', ?)`
  ).run(ip, endpoint, `-${windowSeconds} seconds`);

  // Count recent hits
  const { count } = db
    .prepare(
      `SELECT COUNT(*) as count FROM rate_limit WHERE ip = ? AND endpoint = ? AND hit_at >= datetime('now', ?)`
    )
    .get(ip, endpoint, `-${windowSeconds} seconds`) as { count: number };

  if (count >= maxHits) return true;

  // Record this hit
  db.prepare(`INSERT INTO rate_limit (ip, endpoint) VALUES (?, ?)`).run(ip, endpoint);

  return false;
}
