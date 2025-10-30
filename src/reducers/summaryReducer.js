import * as TYPES from "@/actions/types";
import { getStartDate, formatDate } from "@/utils/helper";

const initialState = {
	summary: {},
	aggregations: {},
	start_date: getStartDate(),
	end_date: formatDate(new Date()),
	alerts: [],
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
		default:
			return state;
	}
};

export default SummaryReducer;
