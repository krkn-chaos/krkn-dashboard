import * as path from "path";
import fs from "fs";

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
    const sql = `SELECT * FROM details`;
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

export const savePodDetails = (containerId, image, mounts, state, status, name, content) => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO details(container_id, image, mounts, state, status, name, content) VALUES (?,?,?,?,?,?,?)`;
    db.run(sql, [containerId, image, mounts, state, status, name, content], function(err) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log("successful insertion");
        resolve({ success: true });
      }
    });
  });
};
