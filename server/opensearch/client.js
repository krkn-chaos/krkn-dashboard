import { Client } from "@opensearch-project/opensearch";

/**
 * OpenSearch client for Elastic Runs (telemetry index + krkn-alerts).
 * Params align with `/summary`, `/comparison`, `/alertsAnalysis` request bodies.
 */
export function createElasticRunsOpenSearchClient({ host, username, password, use_ssl }) {
  const node =
    host && String(host).startsWith("http")
      ? String(host)
      : `https://${host}`;
  const clientOptions = {
    node,
    disableProductCheck: true,
  };
  if (username && password) {
    clientOptions.auth = { username, password };
  }
  if (!use_ssl) {
    clientOptions.ssl = { rejectUnauthorized: false };
  }
  return new Client(clientOptions);
}

/** Used by POST `/connect-es` when the route already built `clientOptions`. */
export function createOpenSearchClientFromOptions(clientOptions) {
  return new Client(clientOptions);
}
