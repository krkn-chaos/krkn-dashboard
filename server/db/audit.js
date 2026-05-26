// Assisted-by: Cursor:Codex5.3
import { all, run } from "./connection.js";

export async function recordAudit({
  groupId = null,
  userId = null,
  action,
  resourceType = null,
  resourceId = null,
  metadata = null,
}) {
  await run(
    `INSERT INTO audit_events (group_id, user_id, action, resource_type, resource_id, metadata)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      groupId,
      userId,
      action,
      resourceType,
      resourceId,
      metadata != null ? JSON.stringify(metadata) : null,
    ]
  );
}

export async function listAuditForGroups(groupIds, { limit = 100 } = {}) {
  if (!groupIds?.length) return [];
  const placeholders = groupIds.map(() => "?").join(",");
  return all(
    `SELECT ae.*, u.username
     FROM audit_events ae
     LEFT JOIN users u ON u.id = ae.user_id
     WHERE ae.group_id IN (${placeholders})
     ORDER BY ae.created_at DESC
     LIMIT ?`,
    [...groupIds, limit]
  );
}

/** Platform admin: all audit events including those without a group_id. */
export async function listAllAuditEvents({ limit = 200 } = {}) {
  return all(
    `SELECT ae.*, u.username
     FROM audit_events ae
     LEFT JOIN users u ON u.id = ae.user_id
     ORDER BY ae.created_at DESC
     LIMIT ?`,
    [limit]
  );
}
