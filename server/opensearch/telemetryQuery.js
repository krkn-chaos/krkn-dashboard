/**
 * Shared query helpers for Elastic Runs **analytics** (summary / comparison / alerts).
 * The runs table (`runsList.js`) uses a separate bool filter tailored to the Storage UI.
 */

export function fieldNameFor(field) {
  if (field === "scenario_type") return "scenarios.scenario_type.keyword";
  if (field === "cloud_infra") return "cloud_infrastructure.keyword";
  if (field === "cloud_infrastructure") return "cloud_infrastructure.keyword";
  if (field === "job_status") return "job_status";
  if (field === "major_version") return "major_version.keyword";
  if (field === "cloud_type") return "cloud_type.keyword";
  return `${field}.keyword`;
}

/** Bool query: date range on `timestamp` + optional `filters` map + optional `extraMust` clauses. */
export function buildAnalyticsBoolQuery({ start_date, end_date, filters, extraMust = [] }) {
  const filterClauses = [];
  if (start_date && end_date) {
    filterClauses.push({
      range: {
        timestamp: {
          gte: start_date,
          lte: end_date,
        },
      },
    });
  }

  if (filters && typeof filters === "object") {
    for (const [field, values] of Object.entries(filters)) {
      if (!Array.isArray(values) || values.length === 0) continue;
      const fieldName = fieldNameFor(field);
      filterClauses.push({
        bool: {
          should: values.map((value) => ({
            term: { [fieldName]: value },
          })),
          minimum_should_match: 1,
        },
      });
    }
  }

  const bool = {};
  if (filterClauses.length) bool.filter = filterClauses;
  if (extraMust.length) bool.must = extraMust;
  return { bool };
}
