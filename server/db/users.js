// Assisted-by: Cursor:Codex5.3
import { assertGroupRoleForPlatformUser } from "../auth/roles.js";
import { all, get, run } from "./connection.js";

const PUBLIC_FIELDS = `id, username, role, must_change_password, disabled, created_at, updated_at`;

export async function countUsers() {
  const row = await get(`SELECT COUNT(*) AS c FROM users`);
  return row?.c ?? 0;
}

export async function findByUsername(username) {
  return get(`SELECT * FROM users WHERE username = ? COLLATE NOCASE AND disabled = 0`, [
    username,
  ]);
}

export async function findById(id) {
  return get(`SELECT * FROM users WHERE id = ?`, [id]);
}

export async function listUsers() {
  return all(`SELECT ${PUBLIC_FIELDS} FROM users ORDER BY username`);
}

export function assertValidPlatformRole(role) {
  if (!["admin", "user"].includes(role)) {
    throw new Error(`Invalid platform role: ${role}`);
  }
}

export async function createUser({
  username,
  passwordHash,
  role,
  mustChangePassword = false,
}) {
  assertValidPlatformRole(role);
  const result = await run(
    `INSERT INTO users (username, password_hash, role, must_change_password)
     VALUES (?, ?, ?, ?)`,
    [username, passwordHash, role, mustChangePassword ? 1 : 0]
  );
  return result.lastID;
}

export async function updateUser(id, fields) {
  const sets = [];
  const params = [];
  if (fields.role != null) {
    assertValidPlatformRole(fields.role);
    sets.push("role = ?");
    params.push(fields.role);
  }
  if (fields.disabled != null) {
    sets.push("disabled = ?");
    params.push(fields.disabled ? 1 : 0);
  }
  if (fields.mustChangePassword != null) {
    sets.push("must_change_password = ?");
    params.push(fields.mustChangePassword ? 1 : 0);
  }
  if (fields.passwordHash != null) {
    sets.push("password_hash = ?");
    params.push(fields.passwordHash);
  }
  if (fields.username != null) {
    sets.push("username = ?");
    params.push(fields.username);
  }
  if (!sets.length) return;
  sets.push("updated_at = datetime('now')");
  params.push(id);
  await run(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, params);
}

export async function getUserGroupMemberships(userId) {
  const rows = await all(
    `SELECT group_id AS groupId, role FROM user_groups WHERE user_id = ? ORDER BY group_id`,
    [userId]
  );
  return rows.map((r) => ({
    groupId: r.groupId,
    role: r.role || "user",
  }));
}

export async function getUserGroupIds(userId) {
  const memberships = await getUserGroupMemberships(userId);
  return memberships.map((m) => m.groupId);
}

export async function setUserGroupMemberships(userId, memberships) {
  const account = await findById(userId);
  const platformRole = account?.role ?? "user";
  await run(`DELETE FROM user_groups WHERE user_id = ?`, [userId]);
  for (const entry of memberships) {
    const groupId =
      typeof entry === "number" ? entry : parseInt(entry.groupId, 10);
    const role =
      typeof entry === "number"
        ? "user"
        : String(entry.role || "user").toLowerCase();
    if (!groupId) continue;
    if (!["admin", "user", "viewer"].includes(role)) {
      throw new Error(`Invalid group role: ${role}`);
    }
    assertGroupRoleForPlatformUser(platformRole, role);
    await run(
      `INSERT INTO user_groups (user_id, group_id, role) VALUES (?, ?, ?)`,
      [userId, groupId, role]
    );
  }
}

/** @deprecated Use setUserGroupMemberships; assigns defaultRole per group. */
export async function setUserGroups(userId, groupIds, defaultRole = "user") {
  await setUserGroupMemberships(
    userId,
    (groupIds || []).map((groupId) => ({
      groupId,
      role: defaultRole,
    }))
  );
}

export function toPublicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    mustChangePassword: Boolean(row.must_change_password),
    disabled: Boolean(row.disabled),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
