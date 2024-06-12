import sqlite3 from "sqlite3";

sqlite3.verbose();

const db = new sqlite3.Database("./krkn.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err) return console.error(err);
});

const sql = `CREATE TABLE config 
(
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    type  VARCHAR(50) NOT NULL,
    namespace VARCHAR(50) NOT NULL,
)`;
