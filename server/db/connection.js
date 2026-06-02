// Assisted-by: Cursor:Codex5.3
import * as path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultDbDir = path.join(__dirname, "..", "..", "database");
const rawDatabaseDir = process.env.DATABASE_PATH || defaultDbDir;
export const databaseDir = path.resolve(rawDatabaseDir);

export function getMostRecentDbAtPath(dir) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const files = fs.readdirSync(dir, { withFileTypes: true });
    const dbFiles = files
      .filter((f) => f.isFile() && f.name.endsWith(".db"))
      .map((f) => path.join(dir, f.name))
      .map((p) => ({ path: p, mtime: fs.statSync(p).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
    return dbFiles.length ? dbFiles[0].path : path.join(dir, "krkn.db");
  } catch (err) {
    if (err.code === "EACCES") {
      throw new Error(`Cannot read database directory (EACCES): ${dir}`);
    }
    if (err.code === "ENOTDIR") {
      throw new Error(`Database path is not a directory: ${dir}`);
    }
    throw err;
  }
}

export const databasePath = getMostRecentDbAtPath(databaseDir);
export const kubeconfigsDir = path.join(databaseDir, "kubeconfigs");

export const db = new sqlite3.Database(
  databasePath,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
);

export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row ?? null);
    });
  });
}

export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

export function exec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
