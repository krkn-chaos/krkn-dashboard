import * as TYPES from "@/actions/types";

const initialState = {
  summary: {},
  aggregations: {}
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
       aggregations: payload
      };
    default:
      return state;
  }
};

export default SummaryReducer;
