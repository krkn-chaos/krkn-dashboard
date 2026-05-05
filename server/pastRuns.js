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
