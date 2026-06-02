// Assisted-by: Cursor:Codex5.3
import fs from "fs";
import path from "path";

import { all, get, kubeconfigsDir, run } from "./connection.js";

export async function createKubeconfigRecord({
  name,
  ownerUserId,
  groupId,
  clusterKey,
  contextName,
  storagePath,
}) {
  const result = await run(
    `INSERT INTO kubeconfigs (name, owner_user_id, group_id, cluster_key, context_name, storage_path)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, ownerUserId, groupId, clusterKey, contextName, storagePath]
  );
  return result.lastID;
}

export async function getKubeconfigById(id) {
  return get(`SELECT * FROM kubeconfigs WHERE id = ?`, [id]);
}

export async function listKubeconfigsForGroupIds(groupIds, { groupIdFilter } = {}) {
  if (!groupIds?.length) return [];

  let sql = `SELECT k.id, k.name, k.owner_user_id, k.group_id, g.name AS group_name,
                    k.cluster_key, k.context_name, k.created_at
             FROM kubeconfigs k
             INNER JOIN groups g ON g.id = k.group_id
             WHERE k.group_id IN (${groupIds.map(() => "?").join(",")})`;
  const params = [...groupIds];

  if (groupIdFilter != null) {
    const gid = parseInt(groupIdFilter, 10);
    if (!groupIds.includes(gid)) return [];
    sql += ` AND k.group_id = ?`;
    params.push(gid);
  }

  sql += ` ORDER BY g.name, k.name`;
  return all(sql, params);
}

export async function updateKubeconfigName(id, name) {
  await run(`UPDATE kubeconfigs SET name = ? WHERE id = ?`, [name, id]);
}

export async function deleteKubeconfig(id) {
  const row = await getKubeconfigById(id);
  if (!row) return false;
  if (row.storage_path && fs.existsSync(row.storage_path)) {
    fs.unlinkSync(row.storage_path);
  }
  await run(`DELETE FROM kubeconfigs WHERE id = ?`, [id]);
  return true;
}

export function kubeconfigFilePath(id) {
  return path.join(kubeconfigsDir, String(id));
}

export async function ensureKubeconfigsDir() {
  fs.mkdirSync(kubeconfigsDir, { recursive: true });
}
