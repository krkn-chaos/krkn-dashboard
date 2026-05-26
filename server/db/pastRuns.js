// Assisted-by: Cursor:Codex5.3
import {
  extractReplayBaseStem,
  formatReplayTimestampSuffix,
} from "../pastRuns.js";
import { all, get, run } from "./connection.js";

const TABLE = "past_runs";

export const saveConfig = async (name, params) => {
  const result = await run(
    `INSERT INTO experiment_presets(name, params) VALUES (?,?)`,
    [name, JSON.stringify(params)]
  );
  return {
    status: 200,
    message: "Config saved successfully",
    id: result.lastID,
  };
};

export const getConfig = async () => {
  const rows = await all(`SELECT * FROM experiment_presets`);
  return { status: 200, message: rows };
};

export const deleteConfig = async (id) => {
  await run(`DELETE FROM experiment_presets WHERE id=(?)`, [id]);
  return { status: 200, message: "Deleted!" };
};

export const getResults = async () => {
  const rows = await all(
    `SELECT * FROM ${TABLE} ORDER BY COALESCE(stored_at, '') DESC, rowid DESC`
  );
  return { status: 200, message: rows };
};

export const getDetailsForAnalytics = async ({
  startDate,
  endDate,
  imageContains,
  groupIds = null,
}) => {
  const conditions = [];
  const params = [];
  if (startDate && String(startDate).trim()) {
    conditions.push("date(COALESCE(pr.stored_at, '')) >= date(?)");
    params.push(String(startDate).trim());
  }
  if (endDate && String(endDate).trim()) {
    conditions.push("date(COALESCE(pr.stored_at, '')) <= date(?)");
    params.push(String(endDate).trim());
  }
  if (imageContains && String(imageContains).trim()) {
    conditions.push("lower(pr.image) LIKE lower(?)");
    params.push(`%${String(imageContains).trim()}%`);
  }
  if (groupIds != null && Array.isArray(groupIds)) {
    if (groupIds.length === 0) return [];
    const ph = groupIds.map(() => "?").join(",");
    conditions.push(`pr.group_id IN (${ph})`);
    params.push(...groupIds);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return all(
    `SELECT pr.*, g.name AS group_name
     FROM ${TABLE} pr
     LEFT JOIN groups g ON g.id = pr.group_id
     ${where} ORDER BY COALESCE(pr.stored_at, '') DESC, pr.rowid DESC`,
    params
  );
};

export const savePodDetails = async (
  containerId,
  image,
  mounts,
  state,
  status,
  name,
  content,
  meta = {}
) => {
  const {
    scenario_params = null,
    replay_of_container_id = null,
    run_kind = null,
    group_id = null,
    kubeconfig_id = null,
    started_by_user_id = null,
    cluster_key = null,
  } = meta;

  await run(
    `INSERT OR REPLACE INTO ${TABLE}(
      container_id, image, mounts, state, status, name, content, stored_at,
      scenario_params, replay_of_container_id, run_kind,
      group_id, kubeconfig_id, started_by_user_id, cluster_key
    ) VALUES (?,?,?,?,?,?,?, datetime('now'),?,?,?,?,?,?,?)`,
    [
      containerId,
      image,
      mounts,
      state,
      status,
      name,
      content,
      scenario_params,
      replay_of_container_id,
      run_kind,
      group_id,
      kubeconfig_id,
      started_by_user_id,
      cluster_key,
    ]
  );
  console.log("Run stored in database:", name);
  return { success: true };
};

export const getDetailsByContainerId = async (containerId, groupIds = null) => {
  if (groupIds != null && Array.isArray(groupIds) && groupIds.length === 0) {
    return null;
  }
  let sql = `SELECT * FROM ${TABLE} WHERE container_id = ?`;
  const params = [containerId];
  if (groupIds != null && Array.isArray(groupIds) && groupIds.length > 0) {
    const ph = groupIds.map(() => "?").join(",");
    sql += ` AND group_id IN (${ph})`;
    params.push(...groupIds);
  }
  sql += ` LIMIT 1`;
  return get(sql, params);
};

export const isStoredRunNameTaken = async (bareName, groupIds = null) => {
  const normalized = String(bareName ?? "").trim().replace(/^\//, "");
  let sql = `SELECT 1 AS ok FROM ${TABLE} WHERE TRIM(REPLACE(name, '/', '')) = ?`;
  const params = [normalized];
  if (groupIds != null && Array.isArray(groupIds) && groupIds.length > 0) {
    const ph = groupIds.map(() => "?").join(",");
    sql += ` AND group_id IN (${ph})`;
    params.push(...groupIds);
  }
  sql += ` LIMIT 1`;
  const row = await get(sql, params);
  return Boolean(row?.ok);
};

export async function allocateUniqueReplayDisplayName(rawStem, groupIds = null) {
  const stem = extractReplayBaseStem(rawStem);
  const ts = formatReplayTimestampSuffix();
  let candidate = `${stem}-replay-${ts}`;
  if (!(await isStoredRunNameTaken(candidate, groupIds))) return candidate;
  let n = 2;
  while (n < 100000) {
    const c = `${stem}-replay-${ts}-${n}`;
    if (!(await isStoredRunNameTaken(c, groupIds))) return c;
    n += 1;
  }
  throw new Error("Could not allocate unique replay name");
}

export async function resolveReplayRootContainerId(containerId) {
  let id = String(containerId ?? "").trim();
  const seen = new Set();
  for (let i = 0; i < 100; i++) {
    if (!id || seen.has(id)) break;
    seen.add(id);
    const row = await getDetailsByContainerId(id);
    if (!row?.replay_of_container_id) return id;
    id = String(row.replay_of_container_id).trim();
  }
  return String(containerId ?? "").trim();
}
