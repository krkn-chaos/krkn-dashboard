/**
 * OpenSearch integration for the **Elastic Runs** tab: runs table + charts + alerts.
 */

export { createElasticRunsOpenSearchClient, createOpenSearchClientFromOptions } from "./client.js";
export { fieldNameFor, buildAnalyticsBoolQuery } from "./telemetryQuery.js";
export { ElasticRunListService, parseFilters } from "./runsList.js";
export {
  fetchSummaryFromOpenSearch,
  fetchComparisonFromOpenSearch,
  fetchAlertsFromOpenSearch,
} from "./analytics.js";
