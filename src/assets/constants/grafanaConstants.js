function normalizeKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function tokenSet(normalized) {
  return new Set(normalized.split("_").filter((t) => t.length > 1));
}

/**
 * Picks the best /d/... path for a run's scenario_type using Grafana listing titles/paths.
 * Returns null if nothing matches (no hardcoded dashboard ids).
 */
export function resolveDashboardPath(scenarioType, dashboardEntries) {
  if (!scenarioType) return null;
  const ns = normalizeKey(scenarioType);
  if (!ns) return null;

  if (!dashboardEntries?.length) return null;

  let bestPath = null;
  let bestScore = 0;

  for (const { title, path } of dashboardEntries) {
    const nt = normalizeKey(title);
    let score = 0;
    if (nt === ns) score = 1000;
    else if (nt && (nt.includes(ns) || ns.includes(nt))) score = 500;
    else {
      const a = tokenSet(ns);
      const b = tokenSet(nt);
      let overlap = 0;
      for (const t of a) {
        if (b.has(t)) overlap += 1;
      }
      score = overlap * 10;
      const np = normalizeKey(path || "");
      if (np && (np.includes(ns) || ns.includes(np))) score += 40;
    }
    if (score > bestScore) {
      bestScore = score;
      bestPath = path;
    }
  }

  return bestScore >= 10 ? bestPath : null;
}
