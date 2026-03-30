import API from "@/utils/axiosInstance";
import * as TYPES from "./types";

export const fetchAlertsData = () => async (dispatch, getState) => {
	try {
		dispatch({ type: TYPES.LOADING });
		const state = getState().storage;
		const size = 25,
			offset = 0;
		const { connectionInfo } = state;
		const response = await API.post("/alertsAnalysis", {
			params: {
				...connectionInfo,
				size,
				offset,
				start_date: "2025-08-01",
				end_date: "2025-10-20",
			},
		});
		if (response.status === 200) {
			console.log("hey");
			dispatch({
				type: TYPES.SET_ALERTS_DATA,
				payload: response.data,
			});
		}
	} catch (err) {
		console.log(err);
	}
	dispatch({ type: TYPES.COMPLETED });
};
