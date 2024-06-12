import { db } from "./db.js";

function insertRow() {
  const [name, color, weight] = process.argv.slice(2);
  db.run(
    `INSERT INTO sharks (name, color, weight) VALUES (?, ?, ?)`,
    [name, color, weight],
    function (error) {
      if (error) {
        console.error(error.message);
      }
      console.log(`Inserted a row with the ID: ${this.lastID}`);
    }
  );
}

insertRow();
