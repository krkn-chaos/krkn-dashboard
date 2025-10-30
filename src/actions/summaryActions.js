import * as TYPES from "./types";

import API from "@/utils/axiosInstance";
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

export const setSummaryDateRange =
	(start_date, end_date) => async (dispatch) => {
		dispatch({
			type: TYPES.SET_SUMMARY_DATE_RANGE,
			payload: { start_date, end_date },
		});
		await dispatch(fetchSummaryData());
	};
