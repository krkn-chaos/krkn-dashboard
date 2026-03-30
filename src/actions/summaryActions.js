import * as TYPES from "./types";

import API from "@/utils/axiosInstance";

export const GROUP_BY_MAP = {
  "Cloud Type": "cloud_type",
  Status: "job_status",
  "Cloud Infrastructure": "cloud_infrastructure",
  Version: "major_version",
};
export const fetchSummaryData = () => async (dispatch, getState) => {
  try {
    dispatch({ type: TYPES.LOADING });
    const state = getState().storage;
    const size = 10,
      offset = 0;
    const { connectionInfo, appliedFilters } = state;
    const { start_date, end_date } = getState().summary;
    const response = await API.post("/summary", {
      params: {
        ...connectionInfo,
        size,
        offset,
        start_date,
        end_date,
        ...(appliedFilters && { filters: appliedFilters }),
      },
    });
    if (response.status === 200) {
      dispatch({
        type: TYPES.SET_AGGREGATIONS,
        payload: response.data,
      });
      dispatch({
        type: TYPES.SET_SUMMARY_METRICS,
        payload: response.data.summary,
      });
    }
  } catch (err) {
    console.log(err);
  }
  dispatch({ type: TYPES.COMPLETED });
};

export const fetchComparisonData = () => async (dispatch, getState) => {
  try {
    dispatch({ type: TYPES.LOADING });
    const state = getState().storage;
    const size = 10,
      offset = 0;
    const { connectionInfo, appliedFilters } = state;
    const { start_date, end_date, group_by } = getState().summary;
    const groupByVal = GROUP_BY_MAP[group_by];
    const response = await API.post("/comparison", {
      params: {
        ...connectionInfo,
        size,
        offset,
        start_date,
        end_date,
        group_by: groupByVal,
        ...(appliedFilters && { filters: appliedFilters }),
      },
    });
    if (response.status === 200) {
      dispatch({
        type: TYPES.COMPARISON_SET_DATA,
        payload: response.data,
      });
      dispatch(transformForHeatMap(response.data));
      dispatch(transformForCloudTypeChart(response.data));
      dispatch(transformForCloudInfraChart(response.data));
    }
  } catch (err) {
    console.log(err);
  }
  dispatch({ type: TYPES.COMPLETED });
};

export const setSummaryDateRange =
  (start_date, end_date) => async (dispatch) => {
    dispatch({
      type: TYPES.SET_SUMMARY_DATE_RANGE,
      payload: { start_date, end_date },
    });
    await dispatch(fetchSummaryData());
  };

export const setGroupBy = (group_by) => async (dispatch) => {
  dispatch({
    type: TYPES.SET_GROUP_BY,
    payload: group_by,
  });
  await dispatch(fetchComparisonData());
};

const transformForHeatMap = (apiData) => (dispatch) => {
  // Guard clause for invalid or empty data
  if (!apiData || !apiData.groups || apiData.groups.length === 0) {
    dispatch({
      type: TYPES.SET_COMPARSION_SCENARIO_DATA,
      payload: { data: [], keys: [] },
    });
    return;
  }

  const { groups } = apiData;
  const heatmapData = {};

  const xAxisKeys = groups.map((group) => group.key);

  groups.forEach((group) => {
    const currentXKey = group.key;
    const scenarios = group.sub_groups?.scenario_type;

    if (!scenarios) return;

    scenarios.forEach((scenario) => {
      const scenarioName = scenario.key
        .replace(/_/g, " ")
        .replace(" scenarios", "");

      const failureRate =
        scenario.total > 0 ? (scenario.success / scenario.total) * 100 : 0;

      // Initialize structure if new scenario
      if (!heatmapData[scenarioName]) {
        heatmapData[scenarioName] = {
          id: scenarioName,
          data: xAxisKeys.map((key) => ({ x: key, y: 0 })),
        };
      }

      // Update the corresponding x value
      const scenarioData = heatmapData[scenarioName].data;
      const target = scenarioData.find((d) => d.x === currentXKey);
      if (target) target.y = parseFloat(failureRate.toFixed(2));
    });
  });

  const finalData = Object.values(heatmapData);

  dispatch({
    type: TYPES.SET_COMPARSION_SCENARIO_DATA,
    payload: { data: finalData, keys: xAxisKeys },
  });
};

const transformForCloudTypeChart = (data) => (dispatch) => {
  if (!data?.groups) return;

  const chartData = data.groups.map((group) => {
    const ct = group.sub_groups?.cloud_type?.[0];

    return {
      version: group.key,
      total: ct?.total || 0,
      success: ct?.success || 0,
      failure: ct?.failure || 0,
    };
  });

  const finalKeys = ["total", "success", "failure"];

  dispatch({
    type: TYPES.SET_COMPARSION_CLOUD_TYPE_DATA,
    payload: { data: chartData, keys: finalKeys },
  });
};

const transformForCloudInfraChart = (apiData) => (dispatch) => {
  if (!apiData || !apiData.groups || apiData.groups.length === 0) {
    dispatch({
      type: TYPES.SET_COMPARSION_CLOUD_INFRA_DATA,
      payload: { chartData: [], pivotRows: [] },
    });
    return;
  }

  const chartData = [];
  const pivotRows = [];

  apiData.groups.forEach((version) => {
    const row = { version: version.key };

    version.sub_groups.cloud_type.forEach((cloud) => {
      const successPercent = cloud.total
        ? Math.round((cloud.success / cloud.total) * 100)
        : 0;

      // Chart row → version + cloud success %
      row[cloud.key] = successPercent;

      // Pivot table row → detailed info
      pivotRows.push({
        version: version.key,
        cloud: cloud.key,
        total: cloud.total,
        success: cloud.success,
        failure: cloud.failure,
        success_percent: successPercent,
      });
    });

    chartData.push(row);
  });
  console.log(chartData);
  dispatch({
    type: TYPES.SET_COMPARSION_CLOUD_INFRA_DATA,
    payload: { chartData, pivotRows },
  });
};
