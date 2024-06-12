import fs from "fs";
// import pkg from "sqlite3";
import sqlite3 from "sqlite3";
//const db = new sqlite3.Database('./chinook.db');
sqlite3.verbose();

let sql = "";
//db connect
const db = new sqlite3.Database(
  "./chinook.db",
  sqlite3.OPEN_READWRITE,
  (error) => {
    if (error) {
      return console.error(error.message);
    }
  }
);

console.log("Connection with SQLite has been established");

const createTable = (db) => {
  db.exec(`
    CREATE TABLE sharks
    (
      ID INTEGER PRIMARY KEY AUTOINCREMENT,
      name   VARCHAR(50) NOT NULL,
      color   VARCHAR(50) NOT NULL,
      weight INTEGER NOT NULL
    );
  `);
};
createTable(db);
// sql = `INSERT INTO sharks(name, color, weight) VALUES (?,?,?)`;

// db.run(sql, ["fred", "green", 190], (err) => {
//   if (err) {
//     return console.error(err);
//   }
// });

//query db

//update

// sql = `UPDATE sharks SET name = ? where id = ?`;
// db.run(sql, ["ken", 2], (err) => {
//   if (err) {
//     return console.log(err);
//   }
// });

sql = `SELECT * FROM sharks`;

db.all(sql, [], (err, rows) => {
  if (err) {
    return console.log(err);
  }
  rows.forEach((row) => {
    console.log(row);
  });
});
