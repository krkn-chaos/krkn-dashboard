// Assisted-by: Cursor:Codex5.3
import fs from "fs";
import path from "path";

import { databaseDir } from "../db/connection.js";
import { countUsers, findByUsername } from "../db/users.js";

const CREDS_FILE = "INITIAL_ADMIN.txt";
const CONSUMED_SUFFIX = ".consumed";
const PREFILL_DELIVERED = ".initial_prefill_delivered";

function credsPath() {
  return path.join(databaseDir, CREDS_FILE);
}

function consumedPath() {
  return path.join(databaseDir, `${CREDS_FILE}${CONSUMED_SUFFIX}`);
}

function prefillDeliveredPath() {
  return path.join(databaseDir, PREFILL_DELIVERED);
}

function parseCredsFile(content) {
  const usernameMatch = content.match(/^Username:\s*(.+)$/m);
  const passwordMatch = content.match(/^Password:\s*(.+)$/m);
  const username = usernameMatch?.[1]?.trim();
  const password = passwordMatch?.[1]?.trim();
  if (!username || !password) return null;
  return { username, password };
}

function resolveCredsFilePath() {
  if (fs.existsSync(credsPath())) return credsPath();
  if (fs.existsSync(consumedPath())) return consumedPath();
  return null;
}

/** Remove one-time login hint artifacts (e.g. after wiping the DB file). */
export function resetInitialLoginHintArtifacts() {
  for (const p of [prefillDeliveredPath(), consumedPath(), credsPath()]) {
    try {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (e) {
      console.warn("[auth] Could not remove initial login artifact:", p, e?.message);
    }
  }
}

/**
 * Return initial admin credentials for first login page load after bootstrap.
 * Idempotent: safe if the login page requests the hint more than once (e.g. React Strict Mode).
 */
export async function consumeInitialLoginHint() {
  const filePath = resolveCredsFilePath();
  if (!filePath) {
    return { available: false };
  }

  const userCount = await countUsers();
  if (userCount !== 1) {
    return { available: false };
  }

  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    return { available: false };
  }

  const parsed = parseCredsFile(content);
  if (!parsed) {
    return { available: false };
  }

  const row = await findByUsername(parsed.username);
  if (!row || row.role !== "admin") {
    return { available: false };
  }

  const alreadyDelivered = fs.existsSync(prefillDeliveredPath());

  if (!alreadyDelivered) {
    try {
      fs.writeFileSync(prefillDeliveredPath(), new Date().toISOString(), {
        mode: 0o600,
      });
      if (filePath === credsPath()) {
        fs.renameSync(credsPath(), consumedPath());
      }
    } catch (e) {
      console.warn("[auth] Could not mark initial prefill delivered:", e?.message);
    }
  }

  return {
    available: true,
    username: parsed.username,
    password: parsed.password,
    firstStart: !alreadyDelivered,
  };
}
