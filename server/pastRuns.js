/** Pure helpers for SQLite-backed past runs analytics (no Elasticsearch). */

export function parseExitCode(status) {
  const n = parseInt(String(status ?? "").trim(), 10);
  return Number.isNaN(n) ? null : n;
}

/** pass | fail — unknown/missing exit code counts as fail for metrics. */
export function rowOutcome(row) {
  const c = parseExitCode(row.status);
  if (c === null) return "fail";
  return c === 0 ? "pass" : "fail";
}

export function filterByNameRegex(rows, pattern) {
  if (!pattern || !String(pattern).trim()) {
    return { rows, error: null };
  }
  try {
    const re = new RegExp(String(pattern).trim());
    return {
      rows: rows.filter((r) => re.test(String(r.name ?? ""))),
      error: null,
    };
  } catch (e) {
    return { rows: [], error: e?.message || "Invalid regex" };
  }
}

export function computeStats(rows) {
  let passes = 0;
  let fails = 0;
  for (const r of rows) {
    if (rowOutcome(r) === "pass") passes++;
    else fails++;
  }
  const total = rows.length;
  const passPercent =
    total === 0 ? 0 : Math.round((10000 * passes) / total) / 100;
  return { total, passes, fails, passPercent };
}

export function filterRowsByOutcome(rows, outcome) {
  if (outcome === "pass") {
    return rows.filter((r) => rowOutcome(r) === "pass");
  }
  if (outcome === "fail") {
    return rows.filter((r) => rowOutcome(r) === "fail");
  }
  return rows;
}

/** @returns {"original" | "replay"} */
export function normalizeRunKind(row) {
  const k = String(row?.run_kind ?? "").trim().toLowerCase();
  if (k === "replay") return "replay";
  return "original";
}

export function filterRowsByRunKind(rows, runKind) {
  if (runKind === "replay") {
    return rows.filter((r) => normalizeRunKind(r) === "replay");
  }
  if (runKind === "original") {
    return rows.filter((r) => normalizeRunKind(r) === "original");
  }
  return rows;
}

export function enrichRunRow(row) {
  if (!row) return row;
  let scenario_params = null;
  const raw = row.scenario_params;
  if (raw != null && String(raw).trim() !== "") {
    try {
      scenario_params = JSON.parse(String(raw));
    } catch {
      scenario_params = null;
    }
  }
  let resiliency = null;
  const rawResiliency = row.resiliency_report;
  if (rawResiliency != null && String(rawResiliency).trim() !== "") {
    try {
      resiliency = JSON.parse(String(rawResiliency));
    } catch {
      resiliency = null;
    }
  }
  return {
    ...row,
    scenario_params,
    resiliency,
    run_kind_normalized: normalizeRunKind(row),
  };
}

/** Strip leading slash and prior `-replay-YYYYMMDD.HHMMSSLL(-N)?` suffix for stem extraction */
export function extractReplayBaseStem(name) {
  let s = String(name ?? "krkn-run").replace(/^\//, "");
  s = s.replace(/-replay-\d{8}\.\d{8}(?:-\d+)?$/i, "");
  return s.trim() || "krkn-run";
}

/** @returns {string} e.g. `20260510.14305247` — LL = two-digit millis fragment */
export function formatReplayTimestampSuffix(d = new Date()) {
  const p = (n, w = 2) => String(n).padStart(w, "0");
  const ymd = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
  const hhmmssll = `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}${p(d.getMilliseconds() % 100)}`;
  return `${ymd}.${hhmmssll}`;
}

export function displayNameFromRow(row) {
  const n = row?.name || "";
  return n.replace(/^\//, "") || row?.container_id?.slice(0, 12) || "—";
}

export function parseStoredAtMs(row) {
  const s = row?.stored_at;
  if (!s) return 0;
  const t = Date.parse(String(s).replace(" ", "T"));
  return Number.isNaN(t) ? 0 : t;
}

export function groupLatestFinishedMs(group) {
  let m = parseStoredAtMs(group.root);
  for (const r of group.replays) {
    m = Math.max(m, parseStoredAtMs(r));
  }
  return m;
}

/**
 * @param {object[]} rows enriched outcome-filtered rows
 * @param {string} runKind filter from request
 */
export function buildRunGroupsFromRows(rows, runKind) {
  if (runKind === "replay") {
    return rows.map((r) => ({
      root: r,
      replays: [],
      isFlatReplay: true,
    }));
  }

  const enriched = rows;
  const rootRows = enriched.filter((r) => !r.replay_of_container_id);
  const byParent = new Map();
  for (const r of enriched) {
    const pid = r.replay_of_container_id;
    if (!pid) continue;
    const key = String(pid).trim();
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(r);
  }

  const groups = [];
  const coveredReplayIds = new Set();

  for (const root of rootRows) {
    const pid = root.container_id;
    const replays = (byParent.get(pid) || []).slice();
    replays.sort((a, b) => parseStoredAtMs(b) - parseStoredAtMs(a));
    replays.forEach((r) => coveredReplayIds.add(r.container_id));
    groups.push({ root, replays });
  }

  for (const r of enriched) {
    if (!r.replay_of_container_id) continue;
    if (coveredReplayIds.has(r.container_id)) continue;
    groups.push({
      root: r,
      replays: [],
      isOrphanReplay: true,
    });
  }

  return groups;
}

export function sortRunGroups(groups, sortBy, sortDir) {
  const dir = sortDir === "asc" ? 1 : -1;
  const mut = [...groups];
  if (sortBy === "name") {
    mut.sort((a, b) => {
      const cmp = displayNameFromRow(a.root).localeCompare(
        displayNameFromRow(b.root),
        undefined,
        { sensitivity: "base" }
      );
      return dir * cmp;
    });
  } else {
    mut.sort((a, b) => {
      const ta = groupLatestFinishedMs(a);
      const tb = groupLatestFinishedMs(b);
      return dir * (ta - tb);
    });
  }
  return mut;
}

export function findGroupIndexForContainerId(groups, containerId) {
  if (!containerId) return -1;
  const id = String(containerId).trim();
  return groups.findIndex(
    (g) =>
      g.root.container_id === id ||
      g.replays.some((r) => r.container_id === id)
  );
}
