import * as path from "path";

import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";

sqlite3.verbose();

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const databaseDirectory = __dirname + "/../database/krkn.db";
export const db = new sqlite3.Database(
  databaseDirectory,
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) return console.error(err);
  }
);

db.exec(`CREATE TABLE IF NOT EXISTS test (
    id INTEGER PRIMARY KEY,
    movie varchar(50),
    quote varchar(50),
    char varchar(50)
  );`);

// db.exec(`DROP TABLE config`);
db.exec(`CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY,
    name varchar(50),
    params json
  );`);
// db.exec(`DROP TABLE details`);
db.exec(`CREATE TABLE IF NOT EXISTS details (
    container_id varchar(250) PRIMARY KEY,
    image varchar(150),
    mounts varchar(100),
    state varchar(20),
    status varchar(10),
    name varchar(50),
    content TEXT
  );`);
