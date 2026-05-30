/**
 * Resiliency-score normalization shared by both data sources.
 *
 * All helpers return the same normalized shape (or null when no score exists):
 *   {
 *     score: number,                       // overall 0-100, rounded
 *     passedSlos: number | null,
 *     totalSlos: number | null,
 *     scenarios: Array<{ name: string, score: number }>
 *   }
 */

const isFiniteNumber = (v) => typeof v === "number" && Number.isFinite(v);

const clampScore = (v) => Math.max(0, Math.min(100, Math.round(v)));

/**
 * Normalize the Elasticsearch telemetry `overall_resiliency_report` object.
 * Shape: { resiliency_score, passed_slos, total_slos, scenarios: { name: score } }
 */
export function normalizeOverallResiliencyReport(report) {
  if (!report || typeof report !== "object") return null;
  if (!isFiniteNumber(report.resiliency_score)) return null;

  const scenarios = [];
  if (report.scenarios && typeof report.scenarios === "object") {
    for (const [name, score] of Object.entries(report.scenarios)) {
      if (isFiniteNumber(score)) {
        scenarios.push({ name, score: clampScore(score) });
      }
    }
  }

  return {
    score: clampScore(report.resiliency_score),
    passedSlos: isFiniteNumber(report.passed_slos) ? report.passed_slos : null,
    totalSlos: isFiniteNumber(report.total_slos) ? report.total_slos : null,
    scenarios,
  };
}

/**
 * Aggregate a krknctl-style report payload:
 *   { scenarios: [{ name, score, weight, breakdown: { passed, failed } }] }
 * Overall score = weighted average of scenario scores (weight default 1).
 */
function normalizeScenarioListReport(payload) {
  const list = Array.isArray(payload?.scenarios) ? payload.scenarios : [];
  const scenarios = [];
  let weightedSum = 0;
  let weightTotal = 0;
  let passed = 0;
  let total = 0;
  let sawBreakdown = false;

  for (const s of list) {
    if (!s || typeof s !== "object") continue;
    if (isFiniteNumber(s.score)) {
      const weight = isFiniteNumber(s.weight) && s.weight > 0 ? s.weight : 1;
      weightedSum += s.score * weight;
      weightTotal += weight;
      scenarios.push({ name: String(s.name ?? "scenario"), score: clampScore(s.score) });
    }
    const b = s.breakdown;
    if (b && typeof b === "object") {
      if (isFiniteNumber(b.passed)) {
        passed += b.passed;
        sawBreakdown = true;
      }
      if (isFiniteNumber(b.failed)) {
        total += b.passed + b.failed;
      }
    }
  }

  if (weightTotal === 0) return null;

  return {
    score: clampScore(weightedSum / weightTotal),
    passedSlos: sawBreakdown ? passed : null,
    totalSlos: sawBreakdown ? total : null,
    scenarios,
  };
}

/**
 * Extract a resiliency score from a local run's captured stdout/logs.
 * Tries, in order:
 *   1. `KRKN_RESILIENCY_REPORT_JSON:{...}` line (krknctl/detailed mode)
 *   2. embedded telemetry `overall_resiliency_report` object
 *   3. `Resiliency check complete. Score: NN%` log line (score only)
 * Returns the normalized shape or null when no score is present.
 */
export function extractResiliencyFromLogs(logText) {
  if (!logText || typeof logText !== "string") return null;

  const jsonPrefix = "KRKN_RESILIENCY_REPORT_JSON:";
  const prefixIdx = logText.lastIndexOf(jsonPrefix);
  if (prefixIdx !== -1) {
    const lineEnd = logText.indexOf("\n", prefixIdx);
    const raw = logText
      .slice(prefixIdx + jsonPrefix.length, lineEnd === -1 ? undefined : lineEnd)
      .trim();
    const parsed = safeJsonParse(raw);
    const normalized = parsed && normalizeScenarioListReport(parsed);
    if (normalized) return normalized;
  }

  const embedded = extractEmbeddedOverallReport(logText);
  if (embedded) {
    const normalized = normalizeOverallResiliencyReport(embedded);
    if (normalized) return normalized;
  }

  const scoreLine = logText.match(/Resiliency check complete\.\s*Score:\s*([\d.]+)\s*%/i);
  if (scoreLine) {
    const score = parseFloat(scoreLine[1]);
    if (Number.isFinite(score)) {
      return { score: clampScore(score), passedSlos: null, totalSlos: null, scenarios: [] };
    }
  }

  return null;
}

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Pull the `overall_resiliency_report` object out of an embedded telemetry blob. */
function extractEmbeddedOverallReport(text) {
  const key = '"overall_resiliency_report"';
  const idx = text.indexOf(key);
  if (idx === -1) return null;
  const braceStart = text.indexOf("{", idx + key.length);
  if (braceStart === -1) return null;

  let depth = 0;
  for (let i = braceStart; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return safeJsonParse(text.slice(braceStart, i + 1));
      }
    }
  }
  return null;
}
