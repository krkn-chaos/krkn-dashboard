const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

export function sanitizeFilename(raw, fallback = "run") {
  const replaced = String(raw ?? "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return replaced || fallback;
}

function stripLeadingSlash(name) {
  return String(name ?? "").replace(/^\//, "");
}

function deriveOutcome(row) {
  const code = String(row?.status ?? "").trim();
  return code === "0" ? "pass" : "fail";
}

function parseScenarioParams(raw) {
  if (raw === null || raw === undefined || raw === "") return {};
  if (typeof raw === "object") return raw;
  try {
    const parsed = JSON.parse(String(raw));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function deriveRunType(row) {
  if (row?.run_kind === "replay" || row?.replay_of_container_id) return "replay";
  return "original";
}

export function buildRunJson(row) {
  return {
    containerId: row?.container_id ?? "",
    name: stripLeadingSlash(row?.name),
    image: row?.image ?? "",
    mount: row?.mounts ?? "",
    state: row?.state ?? "",
    exitCode: String(row?.status ?? ""),
    outcome: deriveOutcome(row),
    finishedAt: row?.stored_at ?? "",
    runType: deriveRunType(row),
    replayOfContainerId: row?.replay_of_container_id ?? null,
    scenarioParams: parseScenarioParams(row?.scenario_params),
    logs: row?.content ?? "",
  };
}

const BASE_STYLES = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #f5f5f5;
    color: #151515;
    font-family: "RedHatText", "Helvetica Neue", Arial, sans-serif;
    font-size: 14px;
    line-height: 1.45;
  }
  .page { max-width: 1100px; margin: 0 auto; padding: 1.5rem; }
  .card {
    background: #ffffff;
    border: 1px solid #d2d2d2;
    border-radius: 4px;
    margin-bottom: 1rem;
    box-shadow: 0 1px 1px rgba(3,3,3,0.05);
  }
  .card-title {
    font-size: 1rem;
    font-weight: 600;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #d2d2d2;
    background: #fafafa;
  }
  .card-body { padding: 1rem; }
  h1 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
    line-height: 1.2;
    color: #151515;
  }
  .muted { color: #6a6e73; font-size: 0.85rem; }
  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .badge {
    display: inline-block;
    padding: 0.15rem 0.6rem;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 600;
    line-height: 1.3;
  }
  .badge-pass { background: #e9f7ef; color: #1e4f29; border: 1px solid #3e8635; }
  .badge-fail { background: #faeae8; color: #7d1007; border: 1px solid #c9190b; }
  table.kv {
    width: 100%;
    border-collapse: collapse;
  }
  table.kv td {
    padding: 0.35rem 0.75rem;
    border-bottom: 1px solid #f0f0f0;
    vertical-align: top;
  }
  table.kv td:first-child {
    color: #6a6e73;
    width: 14rem;
    font-weight: 500;
  }
  details { margin-top: 0.25rem; }
  summary { cursor: pointer; font-weight: 500; }
  pre.logs {
    background: #212427;
    color: #f0f0f0;
    font-family: "RedHatMono", "SFMono-Regular", Consolas, "Liberation Mono", monospace;
    font-size: 12.5px;
    padding: 0.75rem 1rem;
    margin: 0;
    border-radius: 3px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: none;
  }
  .stats { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
  .stat {
    flex: 1 1 9rem;
    background: #ffffff;
    border: 1px solid #d2d2d2;
    border-radius: 4px;
    padding: 0.75rem 1rem;
  }
  .stat-label { color: #6a6e73; font-size: 0.85rem; }
  .stat-value { font-size: 1.5rem; font-weight: 600; line-height: 1.2; }
  table.runs {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }
  table.runs th, table.runs td {
    padding: 0.4rem 0.6rem;
    border-bottom: 1px solid #f0f0f0;
    text-align: left;
    vertical-align: middle;
  }
  table.runs thead th {
    background: #fafafa;
    font-weight: 600;
    border-bottom: 1px solid #d2d2d2;
  }
  tr.replay td:first-child { padding-left: 2rem; }
  tr.replay td:first-child::before { content: "↳ "; color: #6a6e73; }
  @media print {
    body { background: #ffffff; }
    .card { box-shadow: none; }
    pre.logs { max-height: none; }
  }
`;

function htmlShell({ title, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>${BASE_STYLES}</style>
</head>
<body>
<div class="page">
${body}
</div>
</body>
</html>`;
}

function renderKv(rows) {
  const cells = rows
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(
      ([k, v]) =>
        `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`
    )
    .join("\n");
  return `<table class="kv"><tbody>${cells}</tbody></table>`;
}

function renderScenarioParams(params) {
  const keys = Object.keys(params || {});
  if (keys.length === 0) return "<p class=\"muted\">No scenario parameters recorded.</p>";
  const rows = keys
    .sort()
    .map(
      (k) =>
        `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(
          typeof params[k] === "object"
            ? JSON.stringify(params[k])
            : params[k]
        )}</td></tr>`
    )
    .join("\n");
  return `<table class="kv"><tbody>${rows}</tbody></table>`;
}

export function buildRunHtml(row) {
  const run = buildRunJson(row);
  const badgeClass = run.outcome === "pass" ? "badge-pass" : "badge-fail";
  const badgeLabel = run.outcome === "pass" ? "Pass" : "Fail";
  const detailsRows = [
    ["Run ID", run.containerId],
    ["Run type", run.runType === "replay" ? "Replay" : "Original"],
    ["Replay of", run.replayOfContainerId],
    ["Image", run.image],
    ["Mount", run.mount],
    ["State", run.state],
    ["Exit code", run.exitCode],
    ["Finished at", run.finishedAt],
  ];

  const body = `
<div class="header-row">
  <div>
    <h1>${escapeHtml(run.name || run.containerId.slice(0, 12) || "—")}</h1>
    <div class="muted">krkn run report · container ${escapeHtml(run.containerId.slice(0, 12))}</div>
  </div>
  <span class="badge ${badgeClass}">${badgeLabel}</span>
</div>

<div class="card">
  <div class="card-title">Run details</div>
  <div class="card-body">${renderKv(detailsRows)}</div>
</div>

<div class="card">
  <div class="card-title">Scenario parameters</div>
  <div class="card-body">
    <details open>
      <summary>Show parameters</summary>
      ${renderScenarioParams(run.scenarioParams)}
    </details>
  </div>
</div>

<div class="card">
  <div class="card-title">Logs</div>
  <div class="card-body">
    <pre class="logs">${escapeHtml(run.logs)}</pre>
  </div>
</div>`;

  return htmlShell({ title: `krkn run report — ${run.name || run.containerId.slice(0, 12)}`, body });
}

function summarizeRunForHistory(row) {
  const full = buildRunJson(row);
  // Intentionally omit logs and scenarioParams — keep history exports small.
  const { logs: _logs, scenarioParams: _params, ...rest } = full;
  return rest;
}

function flattenGroups(groups) {
  const out = [];
  for (const g of groups || []) {
    if (g?.root) out.push(g.root);
    for (const r of g?.replays || []) out.push(r);
  }
  return out;
}

export function buildHistoryJson({ groups, stats, filters }) {
  const runs = flattenGroups(groups).map(summarizeRunForHistory);
  return {
    exportedAt: new Date().toISOString(),
    filters: filters || {},
    stats: stats || { total: 0, passes: 0, fails: 0, passPercent: 0 },
    runs,
  };
}

function renderFiltersBlock(filters) {
  const f = filters || {};
  const rows = [
    ["Name regex", f.nameRegex || "(none)"],
    ["Image contains", f.imageContains || "(none)"],
    [
      "Date range",
      f.startDate || f.endDate
        ? `${f.startDate || "—"} → ${f.endDate || "—"}`
        : "(all dates)",
    ],
    ["Outcome", f.outcome || "all"],
    ["Run kind", f.runKind || "all"],
    ["Sort", `${f.sortBy || "finishedAt"} ${f.sortDir || "desc"}`],
  ];
  return renderKv(rows);
}

function renderStatsBlock(stats) {
  const s = stats || {};
  return `<div class="stats">
    <div class="stat"><div class="stat-label">Total</div><div class="stat-value">${escapeHtml(s.total ?? 0)}</div></div>
    <div class="stat"><div class="stat-label">Passes</div><div class="stat-value">${escapeHtml(s.passes ?? 0)}</div></div>
    <div class="stat"><div class="stat-label">Failures</div><div class="stat-value">${escapeHtml(s.fails ?? 0)}</div></div>
    <div class="stat"><div class="stat-label">Pass rate</div><div class="stat-value">${escapeHtml(s.passPercent ?? 0)}%</div></div>
  </div>`;
}

function renderHistoryTableRow(row, { isReplay }) {
  const r = summarizeRunForHistory(row);
  const badgeClass = r.outcome === "pass" ? "badge-pass" : "badge-fail";
  const badgeLabel = r.outcome === "pass" ? "Pass" : "Fail";
  return `<tr class="${isReplay ? "replay" : "original"}">
    <td>${escapeHtml(r.name || r.containerId.slice(0, 12) || "—")}</td>
    <td>${isReplay ? "Replay" : "Original"}</td>
    <td>${escapeHtml(r.image || "—")}</td>
    <td>${escapeHtml(r.state || "—")}</td>
    <td>${escapeHtml(r.exitCode || "—")}</td>
    <td><span class="badge ${badgeClass}">${badgeLabel}</span></td>
    <td>${escapeHtml(r.finishedAt || "—")}</td>
  </tr>`;
}

function renderHistoryTable(groups) {
  const flat = [];
  for (const g of groups || []) {
    if (g?.root) flat.push({ row: g.root, isReplay: false });
    for (const r of g?.replays || []) flat.push({ row: r, isReplay: true });
  }
  if (flat.length === 0) {
    return "<p class=\"muted\">No runs match the current filters.</p>";
  }
  const head =
    "<thead><tr><th>Name</th><th>Type</th><th>Image</th><th>State</th><th>Exit code</th><th>Outcome</th><th>Finished at</th></tr></thead>";
  const body = flat
    .map(({ row, isReplay }) => renderHistoryTableRow(row, { isReplay }))
    .join("\n");
  return `<table class="runs">${head}<tbody>${body}</tbody></table>`;
}

export function buildHistoryHtml({ groups, stats, filters }) {
  const exportedAt = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
  const body = `
<div class="header-row">
  <div>
    <h1>krkn runs history</h1>
    <div class="muted">Exported ${escapeHtml(exportedAt)}</div>
  </div>
</div>

<div class="card">
  <div class="card-title">Filters applied</div>
  <div class="card-body">${renderFiltersBlock(filters)}</div>
</div>

${renderStatsBlock(stats)}

<div class="card">
  <div class="card-title">Runs</div>
  <div class="card-body">${renderHistoryTable(groups)}</div>
</div>`;

  return htmlShell({ title: "krkn runs history", body });
}
