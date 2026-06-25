import { all, get, run } from "./connection.js";

export async function createElasticConfig({
  name,
  host,
  port,
  telemetryIndex,
  metricsIndex,
  alertsIndex,
  username,
  password,
  grafanaUrl,
  groupId,
}) {
  const result = await run(
    `INSERT INTO elasticsearch_configs
       (name, host, port, telemetry_index, metrics_index, alerts_index, username, password, grafana_url, group_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, host, port ?? 9200, telemetryIndex ?? "", metricsIndex ?? "", alertsIndex ?? "", username ?? "", password ?? "", grafanaUrl ?? "", groupId]
  );
  return result.lastID;
}

export async function listElasticConfigsForGroupIds(groupIds) {
  if (!groupIds?.length) return [];
  const placeholders = groupIds.map(() => "?").join(", ");
  return all(
    `SELECT ec.*, g.name AS group_name
     FROM elasticsearch_configs ec
     LEFT JOIN groups g ON g.id = ec.group_id
     WHERE ec.group_id IN (${placeholders})
     ORDER BY ec.created_at DESC`,
    groupIds
  );
}

export async function getElasticConfigById(id) {
  return get(`SELECT * FROM elasticsearch_configs WHERE id = ?`, [id]);
}

export async function listAllElasticConfigs() {
  return all(
    `SELECT ec.*, g.name AS group_name
     FROM elasticsearch_configs ec
     LEFT JOIN groups g ON g.id = ec.group_id
     ORDER BY ec.created_at DESC`
  );
}

export async function updateElasticConfig(id, {
  name,
  host,
  port,
  telemetryIndex,
  metricsIndex,
  alertsIndex,
  username,
  password,
  grafanaUrl,
}) {
  await run(
    `UPDATE elasticsearch_configs
     SET name = ?, host = ?, port = ?, telemetry_index = ?, metrics_index = ?,
         alerts_index = ?, username = ?, grafana_url = ?
         ${password !== undefined ? ", password = ?" : ""}
     WHERE id = ?`,
    password !== undefined
      ? [name, host, port ?? 9200, telemetryIndex ?? "", metricsIndex ?? "", alertsIndex ?? "", username ?? "", grafanaUrl ?? "", password, id]
      : [name, host, port ?? 9200, telemetryIndex ?? "", metricsIndex ?? "", alertsIndex ?? "", username ?? "", grafanaUrl ?? "", id]
  );
}

export async function deleteElasticConfig(id) {
  await run(`DELETE FROM elasticsearch_configs WHERE id = ?`, [id]);
}
