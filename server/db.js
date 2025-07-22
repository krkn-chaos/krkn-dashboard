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
