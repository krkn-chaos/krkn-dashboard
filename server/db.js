import * as path from "path";
import fs from "fs";

import { extractReplayBaseStem, formatReplayTimestampSuffix } from "./pastRuns.js";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to this file
const __dirname = path.dirname(__filename); // get the name of the directory

const defaultDbDir = path.join(__dirname, "..", "database");
const rawDatabaseDir = process.env.DATABASE_PATH || defaultDbDir;
const databaseDir = path.resolve(rawDatabaseDir);

function getMostRecentDbAtPath(dir) {
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    const dbFiles = files
      .filter((f) => f.isFile() && f.name.endsWith(".db"))
      .map((f) => path.join(dir, f.name))
      .map((p) => ({ path: p, mtime: fs.statSync(p).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
    return dbFiles.length ? dbFiles[0].path : path.join(dir, "krkn.db");
  } catch (err) {
    if (err.code === "EACCES") {
      throw new Error(
        `Cannot read database directory (EACCES): ${dir}`
      );
    }
    if (err.code === "ENOTDIR") {
      throw new Error(
        `Database path is not a directory: ${dir}`
      );
    }
    throw err;
  }
}

const databasePath = getMostRecentDbAtPath(databaseDir);

export const db = new sqlite3.Database(
  databasePath,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) return console.error(err);
  }
);

db.exec(`CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY,
    name varchar(50),
    params json
  );`);
db.exec(`CREATE TABLE IF NOT EXISTS details (
    container_id varchar(250) PRIMARY KEY,
    image varchar(150),
    mounts varchar(100),
    state varchar(20),
    status varchar(10),
    name varchar(50),
    content TEXT
  );`);

// Add stored_at for ordering (existing DBs)
db.run("ALTER TABLE details ADD COLUMN stored_at TEXT", (e) => {
  if (e && !/duplicate column name/i.test(String(e?.message || ""))) {
    console.warn("[db] ALTER TABLE details ADD COLUMN stored_at:", e?.message);
  }
});

db.run("ALTER TABLE details ADD COLUMN scenario_params TEXT", (e) => {
  if (e && !/duplicate column name/i.test(String(e?.message || ""))) {
    console.warn("[db] ALTER TABLE details ADD COLUMN scenario_params:", e?.message);
  }
});

db.run("ALTER TABLE details ADD COLUMN replay_of_container_id TEXT", (e) => {
  if (e && !/duplicate column name/i.test(String(e?.message || ""))) {
    console.warn("[db] ALTER TABLE details ADD COLUMN replay_of_container_id:", e?.message);
  }
});

db.run("ALTER TABLE details ADD COLUMN run_kind TEXT DEFAULT 'original'", (e) => {
  if (e && !/duplicate column name/i.test(String(e?.message || ""))) {
    console.warn("[db] ALTER TABLE details ADD COLUMN run_kind:", e?.message);
  }
});

// Normalized resiliency score (JSON) parsed from captured run logs
db.run("ALTER TABLE details ADD COLUMN resiliency_report TEXT", (e) => {
  if (e && !/duplicate column name/i.test(String(e?.message || ""))) {
    console.warn("[db] ALTER TABLE details ADD COLUMN resiliency_report:", e?.message);
  }
});

// Database functions
export const saveConfig = (name, params) => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO config(name, params) VALUES (?,?)`;
    db.run(sql, [name, JSON.stringify(params)], function(err) {
      if (err) {
        console.log(err);
        reject({
          status: 300,
          message: "error inserting params",
          error: err,
        });
      } else {
        console.log("successful insertion");
        resolve({
          status: 200,
          message: "Config saved successfully",
        });
      }
    });
  });
};

export const getConfig = () => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM config`;
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject({
          status: 300,
          message: "error getting the config",
          error: err,
        });
      } else {
        resolve({
          status: 200,
          message: rows,
        });
      }
    });
  });
};

export const getResults = () => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM details ORDER BY COALESCE(stored_at, '') DESC, rowid DESC`;
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject({
          status: 300,
          message: "error getting details",
          error: err,
        });
      } else {
        resolve({
          status: 200,
          message: rows,
        });
      }
    });
  });
};

/** Filter by stored date (inclusive) and optional image substring (SQLite; name regex applied in API). */
export const getDetailsForAnalytics = ({ startDate, endDate, imageContains }) => {
  return new Promise((resolve, reject) => {
    const conditions = [];
    const params = [];
    if (startDate && String(startDate).trim()) {
      conditions.push("date(COALESCE(stored_at, '')) >= date(?)");
      params.push(String(startDate).trim());
    }
    if (endDate && String(endDate).trim()) {
      conditions.push("date(COALESCE(stored_at, '')) <= date(?)");
      params.push(String(endDate).trim());
    }
    if (imageContains && String(imageContains).trim()) {
      conditions.push("lower(image) LIKE lower(?)");
      params.push(`%${String(imageContains).trim()}%`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `SELECT * FROM details ${where} ORDER BY COALESCE(stored_at, '') DESC, rowid DESC`;
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject({ status: 300, message: "error querying details", error: err });
      } else {
        resolve(rows || []);
      }
    });
  });
};

export const deleteConfig = (id) => {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM config WHERE id=(?)`;
    db.run(sql, [id], function(err) {
      if (err) {
        console.log(err);
        reject({ status: 300, message: "error", error: err });
      } else {
        resolve({
          status: 200,
          message: "Deleted!",
        });
      }
    });
  });
};

/**
 * @param {{ scenario_params?: string | null, replay_of_container_id?: string | null, run_kind?: string | null }} [meta]
 */
export const savePodDetails = (
  containerId,
  image,
  mounts,
  state,
  status,
  name,
  content,
  meta = {}
) => {
  const {
    scenario_params = null,
    replay_of_container_id = null,
    run_kind = null,
    resiliency_report = null,
  } = meta;
  return new Promise((resolve, reject) => {
    const sql = `INSERT OR REPLACE INTO details(
      container_id, image, mounts, state, status, name, content, stored_at,
      scenario_params, replay_of_container_id, run_kind, resiliency_report
    ) VALUES (?,?,?,?,?,?,?, datetime('now'),?,?,?,?)`;
    db.run(
      sql,
      [
        containerId,
        image,
        mounts,
        state,
        status,
        name,
        content,
        scenario_params,
        replay_of_container_id,
        run_kind,
        resiliency_report,
      ],
      function(err) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log("Run stored in database:", name);
          resolve({ success: true });
        }
      }
    );
  });
};

export const getDetailsByContainerId = (containerId) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM details WHERE container_id = ? LIMIT 1`;
    db.get(sql, [containerId], (err, row) => {
      if (err) {
        reject({
          status: 300,
          message: "error getting details by container id",
          error: err,
        });
      } else {
        resolve(row || null);
      }
    });
  });
};

/** Compare display names with optional leading slash from Podman */
export const isStoredRunNameTaken = (bareName) => {
  const normalized = String(bareName ?? "").trim().replace(/^\//, "");
  return new Promise((resolve, reject) => {
    const sql = `SELECT 1 AS ok FROM details WHERE TRIM(REPLACE(name, '/', '')) = ? LIMIT 1`;
    db.get(sql, [normalized], (err, row) => {
      if (err) reject(err);
      else resolve(Boolean(row?.ok));
    });
  });
};

export async function allocateUniqueReplayDisplayName(rawStem) {
  const stem = extractReplayBaseStem(rawStem);
  const ts = formatReplayTimestampSuffix();
  let candidate = `${stem}-replay-${ts}`;
  if (!(await isStoredRunNameTaken(candidate))) return candidate;
  let n = 2;
  while (n < 100000) {
    const c = `${stem}-replay-${ts}-${n}`;
    if (!(await isStoredRunNameTaken(c))) return c;
    n += 1;
  }
  throw new Error("Could not allocate unique replay name");
}

/** Walk replay chain to the root original run container id */
export async function resolveReplayRootContainerId(containerId) {
  let id = String(containerId ?? "").trim();
  const seen = new Set();
  for (let i = 0; i < 100; i++) {
    if (!id || seen.has(id)) break;
    seen.add(id);
    const row = await getDetailsByContainerId(id);
    if (!row?.replay_of_container_id) return id;
    id = String(row.replay_of_container_id).trim();
  }
  return String(containerId ?? "").trim();
}
