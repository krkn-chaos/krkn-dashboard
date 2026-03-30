import * as TYPES from "@/actions/types";
import { getStartDate, formatDate } from "@/utils/helper";

const initialState = {
  summary: {},
  aggregations: {},
  start_date: getStartDate(),
  end_date: formatDate(new Date()),
  alerts: [],
  group_by: "Status",
  comparisonData: {},
  scenarioComparisonData: {},
  cloudTypeComparisonData: {},
  cloudInfraComparisonData: {},
};

const SummaryReducer = (state = initialState, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case TYPES.SET_SUMMARY_METRICS:
      return {
        ...state,
        summary: payload,
      };
    case TYPES.SET_AGGREGATIONS:
      return {
        ...state,
        aggregations: payload,
      };
    case TYPES.SET_ALERTS_DATA:
      return {
        ...state,
        alerts: payload,
      };
    case TYPES.SET_SUMMARY_DATE_RANGE: {
      return {
        ...state,
        start_date: payload.start_date,
        end_date: payload.end_date,
      };
    }
    case TYPES.SET_GROUP_BY:
      return {
        ...state,
        group_by: payload,
      };
    case TYPES.COMPARISON_SET_DATA:
      return {
        ...state,
        comparisonData: payload,
      };
    case TYPES.SET_COMPARSION_SCENARIO_DATA:
      return {
        ...state,
        scenarioComparisonData: payload,
      };
    case TYPES.SET_COMPARSION_CLOUD_TYPE_DATA:
      return {
        ...state,
        cloudTypeComparisonData: payload,
      };
    case TYPES.SET_COMPARSION_CLOUD_INFRA_DATA:
      return {
        ...state,
        cloudInfraComparisonData: payload,
      };
    default:
      return state;
  }
};

export default SummaryReducer;
