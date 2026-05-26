import {
  buildHistoryHtml,
  buildHistoryJson,
  buildRunHtml,
  buildRunJson,
  sanitizeFilename,
} from "./runExport.js";
import {
  buildRunGroupsFromRows,
  computeStats,
  enrichRunRow,
  filterByNameRegex,
  filterRowsByOutcome,
  filterRowsByRunKind,
  rowOutcome,
  sortRunGroups,
} from "./pastRuns.js";

const ALLOWED_FORMATS = new Set(["json", "html"]);

function pickFormat(req) {
  const raw = String(req.query?.format || "json").toLowerCase().trim();
  return ALLOWED_FORMATS.has(raw) ? raw : null;
}

function setAttachmentHeaders(res, { format, baseName }) {
  const ext = format === "html" ? "html" : "json";
  const safe = sanitizeFilename(baseName, `run`);
  res.setHeader(
    "Content-Type",
    format === "html" ? "text/html; charset=utf-8" : "application/json; charset=utf-8"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safe}.${ext}"`
  );
}

function todayUtc() {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildHistoryFromRows({ rows, body }) {
  const {
    nameRegex = "",
    imageContains = "",
    startDate = "",
    endDate = "",
    outcome = "all",
    runKind = "all",
    sortBy = "finishedAt",
    sortDir = "desc",
  } = body || {};
  const nameFilter = filterByNameRegex(rows, nameRegex);
  if (nameFilter.error) {
    const err = new Error(`Invalid name regex: ${nameFilter.error}`);
    err.statusCode = 400;
    throw err;
  }
  let filtered = nameFilter.rows;
  filtered = filterRowsByRunKind(filtered, runKind);
  const stats = computeStats(filtered);
  const tableRows = filterRowsByOutcome(filtered, outcome).map((r) => ({
    ...enrichRunRow(r),
    outcome: rowOutcome(r),
  }));
  const safeSortBy =
    sortBy === "name" || sortBy === "finishedAt" ? sortBy : "finishedAt";
  const safeSortDir = sortDir === "asc" || sortDir === "desc" ? sortDir : "desc";
  const groups = sortRunGroups(
    buildRunGroupsFromRows(tableRows, runKind),
    safeSortBy,
    safeSortDir
  );
  return {
    groups,
    stats,
    filters: {
      nameRegex,
      imageContains,
      startDate,
      endDate,
      outcome,
      runKind,
      sortBy: safeSortBy,
      sortDir: safeSortDir,
    },
  };
}

export function mountExportRoutes(app, deps) {
  const { getDetailsByContainerId, getDetailsForAnalytics } = deps;

  app.get("/past-runs/:containerId/export", async (req, res) => {
    const format = pickFormat(req);
    if (!format) {
      return res.status(400).json({ error: "Invalid format (use json or html)" });
    }
    try {
      const row = await getDetailsByContainerId(req.params.containerId);
      if (!row) {
        return res.status(404).json({ error: "Run not found" });
      }
      const baseName = `${String(row.name || "").replace(/^\//, "") || "run"}-${String(
        row.container_id || ""
      ).slice(0, 12)}`;
      setAttachmentHeaders(res, { format, baseName });
      if (format === "html") {
        return res.send(buildRunHtml(row));
      }
      return res.send(JSON.stringify(buildRunJson(row), null, 2));
    } catch (err) {
      return res
        .status(500)
        .json({ error: err?.message || "Failed to export run" });
    }
  });

  app.post("/past-runs/export", async (req, res) => {
    const format = pickFormat(req);
    if (!format) {
      return res.status(400).json({ error: "Invalid format (use json or html)" });
    }
    try {
      const body = req.body || {};
      const rows = await getDetailsForAnalytics({
        startDate: body.startDate,
        endDate: body.endDate,
        imageContains: body.imageContains,
      });
      const history = buildHistoryFromRows({ rows, body });
      const baseName = `krkn-runs-history-${todayUtc()}`;
      setAttachmentHeaders(res, { format, baseName });
      if (format === "html") {
        return res.send(buildHistoryHtml(history));
      }
      return res.send(JSON.stringify(buildHistoryJson(history), null, 2));
    } catch (err) {
      const status = err?.statusCode || 500;
      return res
        .status(status)
        .json({ error: err?.message || "Failed to export history" });
    }
  });
}
