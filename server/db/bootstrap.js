// Assisted-by: Cursor:Codex5.3
import crypto from "crypto";
import fs from "fs";
import path from "path";

import { readDashboardAdminCredentialsFromEnv } from "../config/loadEnv.js";
import { hashPassword } from "../auth/password.js";
import { resetInitialLoginHintArtifacts } from "../auth/initialLoginHint.js";
import { databaseDir } from "./connection.js";
import { all, get, run } from "./connection.js";
import * as groupsDb from "./groups.js";
import * as policiesDb from "./policies.js";
import * as usersDb from "./users.js";

function randomHex(bytes = 4) {
  return crypto.randomBytes(bytes).toString("hex");
}

export async function bootstrapIfEmpty() {
  const row = await get(`SELECT COUNT(*) AS c FROM users`);
  if ((row?.c ?? 0) > 0) return null;

  resetInitialLoginHintArtifacts();

  const groupId = await groupsDb.createGroup({
    name: "default-group",
    description: "Default group for initial admin",
  });

  const { username: envUsername, password: envPassword, fromEnv } =
    readDashboardAdminCredentialsFromEnv();
  const username = envUsername || `admin-${randomHex(4)}`;
  const password =
    envPassword || crypto.randomBytes(16).toString("base64url");
  const passwordHash = await hashPassword(password);

  const userId = await usersDb.createUser({
    username,
    passwordHash,
    role: "admin",
    mustChangePassword: false,
  });

  await groupsDb.addUserToGroup(userId, groupId, "admin");

  for (const permission of ["view", "run", "cancel", "admin"]) {
    await policiesDb.createPolicy({
      subjectType: "group",
      subjectId: groupId,
      clusterKey: "*",
      permission,
    });
  }

  const credsPath = path.join(databaseDir, "INITIAL_ADMIN.txt");
  const credsBody = [
    "Krkn Dashboard — initial admin credentials",
    "Store these credentials securely. Change the password in Account Settings if desired.",
    "",
    `Username: ${username}`,
    `Password: ${password}`,
    "",
    `Created: ${new Date().toISOString()}`,
  ].join("\n");

  fs.mkdirSync(databaseDir, { recursive: true });
  fs.writeFileSync(credsPath, credsBody, { mode: 0o600 });

  console.log("\n========================================");
  console.log("Krkn Dashboard: initial admin created");
  console.log(`  Username: ${username}`);
  console.log(`  Password: ${password}`);
  console.log(`  Credentials file: ${credsPath}`);
  if (fromEnv) {
    console.log(
      "  (credentials from DASHBOARD_ADMIN_USERNAME / DASHBOARD_ADMIN_PASSWORD)"
    );
  }
  console.log("========================================\n");

  return { username, password, userId, groupId };
}

export async function getDefaultGroupId() {
  const g = await get(
    `SELECT id FROM groups WHERE name = ? COLLATE NOCASE LIMIT 1`,
    ["default-group"]
  );
  return g?.id ?? null;
}

/** Assign legacy past_runs without group to default-group */
export async function migrateOrphanPastRuns() {
  const defaultGroupId = await getDefaultGroupId();
  if (!defaultGroupId) return;
  await run(
    `UPDATE past_runs SET group_id = ? WHERE group_id IS NULL`,
    [defaultGroupId]
  );
}
