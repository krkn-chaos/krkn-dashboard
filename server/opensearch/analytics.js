import { createElasticRunsOpenSearchClient } from "./client.js";
import { buildAnalyticsBoolQuery, fieldNameFor } from "./telemetryQuery.js";

const SUCCESS_VALUES = new Set(["1", "true", "success", "passed"]);

const isSuccessKey = (key) => SUCCESS_VALUES.has(String(key ?? "").toLowerCase());

/** Matches runs_per_day row shape: per-status counts on the row + legacy "1"/"0" keys for Summary charts. */
const parseTermsWithStatus = (buckets = []) =>
  buckets.map((bucket) => {
    const entry = {
      key: bucket.key,
      total: bucket.doc_count || 0,
      success: 0,
      failure: 0,
    };
    for (const st of bucket?.by_status?.buckets || []) {
      const k = st.key_as_string ?? st.key;
      const count = st.doc_count || 0;
      entry[k] = count;
      if (isSuccessKey(k)) entry.success += count;
      else entry.failure += count;
    }
    entry["1"] = entry.success;
    entry["0"] = entry.failure;
    return entry;
  });

const buildQuery = (params) => buildAnalyticsBoolQuery(params);

const getSummaryCounts = async (client, index, query) => {
  const resp = await client.search({
    index,
    body: {
      size: 0,
      query,
      aggs: { summary: { terms: { field: "job_status" } } },
    },
  });
  const buckets = resp?.body?.aggregations?.summary?.buckets || [];
  let success = 0;
  let failure = 0;
  for (const bucket of buckets) {
    if (isSuccessKey(bucket.key_as_string ?? bucket.key)) success += bucket.doc_count || 0;
    else failure += bucket.doc_count || 0;
  }
  const total_runs = success + failure;
  const pass_rate =
    total_runs > 0
      ? `${Math.round((success / total_runs) * 10000) / 100}%`
      : "0.00%";
  return { total_runs, success, failure, pass_rate };
};

const getRunsPerDay = async (client, index, query) => {
  const resp = await client.search({
    index,
    body: {
      size: 0,
      query,
      aggs: {
        runs_per_day: {
          date_histogram: {
            field: "timestamp",
            calendar_interval: "day",
            format: "yyyy-MM-dd",
          },
          aggs: { by_status: { terms: { field: "job_status" } } },
        },
      },
    },
  });
  const buckets = resp?.body?.aggregations?.runs_per_day?.buckets || [];
  return buckets.map((bucket) => {
    const entry = { date: bucket.key_as_string };
    for (const st of bucket.by_status?.buckets || []) {
      entry[st.key_as_string ?? st.key] = st.doc_count || 0;
    }
    return entry;
  });
};

const getTermsWithStatus = async (client, index, query, aggName, field) => {
  const resp = await client.search({
    index,
    body: {
      size: 0,
      query,
      aggs: {
        [aggName]: {
          terms: { field, size: 10 },
          aggs: { by_status: { terms: { field: "job_status" } } },
        },
      },
    },
  });
  const buckets = resp?.body?.aggregations?.[aggName]?.buckets || [];
  return parseTermsWithStatus(buckets);
};

const getTopFailures = async (client, index, query) => {
  const resp = await client.search({
    index,
    body: {
      size: 0,
      query,
      aggs: {
        top_failures: {
          terms: {
            field: "scenarios.scenario_type.keyword",
            size: 10,
            order: { _count: "desc" },
          },
        },
      },
    },
  });
  const buckets = resp?.body?.aggregations?.top_failures?.buckets || [];
  return buckets.map((bucket) => ({
    scenario_type: bucket.key,
    failures: bucket.doc_count || 0,
  }));
};

const normalizeComparison = (aggs, group_by) => {
  const result = { group_by, groups: [] };
  const groups = aggs?.group_by?.buckets || [];
  for (const bucket of groups) {
    const groupData = {
      key: bucket.key,
      total: bucket.doc_count || 0,
      success: 0,
      failure: 0,
      sub_groups: {},
    };
    for (const st of bucket?.by_status?.buckets || []) {
      if (isSuccessKey(st.key_as_string ?? st.key)) groupData.success += st.doc_count || 0;
      else groupData.failure += st.doc_count || 0;
    }
    for (const [subGroupName, subGroupData] of Object.entries(bucket)) {
      if (["key", "doc_count", "by_status"].includes(subGroupName)) continue;
      const subBuckets = subGroupData?.buckets || [];
      groupData.sub_groups[subGroupName] = subBuckets.map((subBucket) => {
        let success = 0;
        let failure = 0;
        for (const s of subBucket?.by_status?.buckets || []) {
          if (isSuccessKey(s.key_as_string ?? s.key)) success += s.doc_count || 0;
          else failure += s.doc_count || 0;
        }
        return {
          key: subBucket.key,
          total: subBucket.doc_count || 0,
          success,
          failure,
        };
      });
    }
    result.groups.push(groupData);
  }
  return result;
};

export const fetchSummaryFromOpenSearch = async (params) => {
  const client = createElasticRunsOpenSearchClient(params);
  const index = params.index || params.es_index || "*";
  const baseQuery = buildQuery(params);
  const failuresQuery = buildQuery({
    ...params,
    extraMust: [{ term: { job_status: "false" } }],
  });

  const [summary, runs_per_day, scenario_type, cloud_type, cloud_infra, major_version, top_failures] =
    await Promise.all([
      getSummaryCounts(client, index, baseQuery),
      getRunsPerDay(client, index, baseQuery),
      getTermsWithStatus(client, index, baseQuery, "scenario_type", "scenarios.scenario_type.keyword"),
      getTermsWithStatus(client, index, baseQuery, "cloud_type", "cloud_type.keyword"),
      getTermsWithStatus(client, index, baseQuery, "cloud_infra", "cloud_infrastructure.keyword"),
      getTermsWithStatus(client, index, baseQuery, "major_version", "major_version.keyword"),
      getTopFailures(client, index, failuresQuery),
    ]);

  return {
    summary,
    runs_per_day,
    scenario_type,
    cloud_type,
    cloud_infra,
    major_version,
    top_failures,
  };
};

export const fetchComparisonFromOpenSearch = async (params) => {
  const client = createElasticRunsOpenSearchClient(params);
  const index = params.index || params.es_index || "*";
  const group_by = params.group_by || "scenario_type";
  const validFields = ["major_version", "cloud_type", "cloud_infra", "scenario_type", "job_status"];
  if (!validFields.includes(group_by)) {
    throw new Error(`Invalid group_by field: ${group_by}`);
  }
  const subGroups = validFields.filter((f) => f !== group_by);
  const aggs = {
    group_by: {
      terms: { field: fieldNameFor(group_by), size: 10 },
      aggs: {
        by_status: { terms: { field: "job_status" } },
      },
    },
  };
  for (const sub of subGroups) {
    aggs.group_by.aggs[sub] = {
      terms: { field: fieldNameFor(sub), size: 10 },
      aggs: { by_status: { terms: { field: "job_status" } } },
    };
  }

  const resp = await client.search({
    index,
    body: {
      size: 0,
      query: buildQuery(params),
      aggs,
    },
  });
  return normalizeComparison(resp?.body?.aggregations, group_by);
};

export const fetchAlertsFromOpenSearch = async (params) => {
  const client = createElasticRunsOpenSearchClient(params);
  const index = params.index || params.es_index || "*";

  const failedRunsResp = await client.search({
    index,
    body: {
      size: 100,
      _source: ["run_uuid", "scenarios.scenario_type"],
      query: buildQuery({
        ...params,
        extraMust: [{ term: { job_status: "false" } }],
      }),
    },
  });

  const failedHits = failedRunsResp?.body?.hits?.hits || [];
  const runInfo = {};
  const runUuids = [];
  for (const hit of failedHits) {
    const run_uuid = hit?._source?.run_uuid;
    if (!run_uuid) continue;
    runUuids.push(run_uuid);
    runInfo[run_uuid] = hit?._source?.scenarios?.[0]?.scenario_type || "Unknown Scenario";
  }
  if (!runUuids.length) {
    return { total: 0, alerts: [] };
  }

  const alertsIndex = "krkn-alerts";
  const runUuidShould = runUuids.flatMap((uuid) => [
    { match: { run_uuid: uuid } },
    { term: { "run_uuid.keyword": uuid } },
  ]);
  const alertsResp = await client.search({
    index: alertsIndex,
    body: {
      query: {
        bool: {
          should: runUuidShould,
          minimum_should_match: 1,
        },
      },
      sort: [{ created_at: { order: "desc" } }],
      _source: ["run_uuid", "alert", "severity", "created_at"],
      size: params.size || 25,
      from: params.offset || 0,
    },
  });

  const rawTotal = alertsResp?.body?.hits?.total;
  const total =
    typeof rawTotal === "object" && rawTotal !== null
      ? rawTotal.value ?? 0
      : Number(rawTotal) || 0;
  const alerts = (alertsResp?.body?.hits?.hits || []).map((hit) => {
    const src = hit?._source || {};
    return {
      run_uuid: src.run_uuid,
      scenario_type: runInfo[src.run_uuid] || "Unknown Scenario",
      alert: src.alert || "N/A",
      severity: src.severity || "N/A",
      created_at: src.created_at || "N/A",
    };
  });
  return { total, alerts };
};
