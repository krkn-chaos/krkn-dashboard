// Assisted-by: Cursor:Codex5.3
import { all, get, run } from "./connection.js";

export async function createGroup({ name, description = null }) {
  const result = await run(
    `INSERT INTO groups (name, description) VALUES (?, ?)`,
    [name, description]
  );
  return result.lastID;
}

export async function listGroups() {
  return all(`SELECT id, name, description, created_at FROM groups ORDER BY name`);
}

export async function findGroupById(id) {
  return get(`SELECT * FROM groups WHERE id = ?`, [id]);
}

export async function findGroupByName(name) {
  return get(`SELECT * FROM groups WHERE name = ? COLLATE NOCASE`, [name]);
}

export async function addUserToGroup(userId, groupId, role = "user") {
  await run(`DELETE FROM user_groups WHERE user_id = ? AND group_id = ?`, [
    userId,
    groupId,
  ]);
  await run(
    `INSERT INTO user_groups (user_id, group_id, role) VALUES (?, ?, ?)`,
    [userId, groupId, role]
  );
}

export async function setUserGroupRole(userId, groupId, role) {
  const result = await run(
    `UPDATE user_groups SET role = ? WHERE user_id = ? AND group_id = ?`,
    [role, userId, groupId]
  );
  return result.changes > 0;
}

export async function deleteGroup(id) {
  await run(`DELETE FROM groups WHERE id = ?`, [id]);
}

export async function listGroupMembers(groupId) {
  const rows = await all(
    `SELECT u.id, u.username, u.role AS platform_role, ug.role AS group_role
     FROM users u
     INNER JOIN user_groups ug ON ug.user_id = u.id
     WHERE ug.group_id = ?
     ORDER BY u.username`,
    [groupId]
  );
  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    platformRole: r.platform_role,
    groupRole: r.group_role || "user",
  }));
}

export async function removeUserFromGroup(userId, groupId) {
  await run(`DELETE FROM user_groups WHERE user_id = ? AND group_id = ?`, [
    userId,
    groupId,
  ]);
}
