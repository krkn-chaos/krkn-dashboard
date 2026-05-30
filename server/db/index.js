// Assisted-by: Cursor:Codex5.3
import fs from "fs";

import { bootstrapIfEmpty, migrateOrphanPastRuns } from "./bootstrap.js";
import { databaseDir, db, kubeconfigsDir } from "./connection.js";
import { ensureKubeconfigsDir } from "./kubeconfigs.js";
import { runMigrations } from "./migrate.js";

let initPromise = null;

export async function initDatabase() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    fs.mkdirSync(databaseDir, { recursive: true });
    fs.mkdirSync(kubeconfigsDir, { recursive: true });
    await runMigrations();
    await ensureKubeconfigsDir();
    await bootstrapIfEmpty();
    await migrateOrphanPastRuns();
  })();
  return initPromise;
}

export { db, databaseDir, kubeconfigsDir } from "./connection.js";
export * from "./pastRuns.js";
export * from "./users.js";
export * from "./groups.js";
export * from "./policies.js";
export * from "./audit.js";
export * from "./kubeconfigs.js";
export { getDefaultGroupId } from "./bootstrap.js";
