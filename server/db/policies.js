// Assisted-by: Cursor:Codex5.3
import { all, get, run } from "./connection.js";

const VALID_PERMISSIONS = ["view", "run", "cancel", "admin"];

export function isValidPermission(permission) {
  return VALID_PERMISSIONS.includes(permission);
}

export async function listPoliciesForGroup(groupId) {
  return all(
    `SELECT id, subject_type, subject_id, cluster_key, permission, created_at
     FROM policies
     WHERE subject_type = 'group' AND subject_id = ?
     ORDER BY cluster_key, permission`,
    [groupId]
  );
}

export async function listPoliciesForUser(_userId, groupIds) {
  if (!groupIds?.length) return [];
  const placeholders = groupIds.map(() => "?").join(",");
  return all(
    `SELECT permission, cluster_key FROM policies
     WHERE subject_type = 'group' AND subject_id IN (${placeholders})`,
    groupIds
  );
}

export async function listPoliciesWithGroupNames() {
  return all(
    `SELECT p.id, p.subject_id AS group_id, g.name AS group_name,
            p.cluster_key, p.permission, p.created_at
     FROM policies p
     INNER JOIN groups g ON p.subject_type = 'group' AND p.subject_id = g.id
     ORDER BY g.name, p.cluster_key, p.permission`
  );
}

export async function getGroupPolicyById(policyId, groupId) {
  return get(
    `SELECT * FROM policies
     WHERE id = ? AND subject_type = 'group' AND subject_id = ?`,
    [policyId, groupId]
  );
}

export async function getPolicyById(policyId) {
  return get(
    `SELECT * FROM policies WHERE id = ? AND subject_type = 'group'`,
    [policyId]
  );
}

export async function createPolicy({
  subjectType = "group",
  subjectId,
  clusterKey,
  permission,
}) {
  if (subjectType !== "group") {
    throw new Error("Policies can only be assigned to groups");
  }
  const result = await run(
    `INSERT INTO policies (subject_type, subject_id, cluster_key, permission)
     VALUES ('group', ?, ?, ?)`,
    [subjectId, clusterKey, permission]
  );
  return result.lastID;
}

export async function deletePolicy(id) {
  await run(`DELETE FROM policies WHERE id = ?`, [id]);
}

export async function removeUserScopedPolicies() {
  await run(`DELETE FROM policies WHERE subject_type = 'user'`);
}
