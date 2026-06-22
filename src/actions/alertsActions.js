import API from "@/utils/axiosInstance";
import * as TYPES from "./types";

export const fetchAlertsData = (startDate, endDate, page = 1, perPage = 25) => async (dispatch, getState) => {
  try {
    dispatch({ type: TYPES.LOADING });
    const state = getState().storage;
    const summaryDates = getState().summary;
    const { connectionInfo } = state;
    const response = await API.post("/alertsAnalysis", {
      params: {
        ...connectionInfo,
        size: perPage,
        offset: (page - 1) * perPage,
        start_date: startDate ?? summaryDates.start_date,
        end_date: endDate ?? summaryDates.end_date,
      },
    });
    if (response.status === 200) {
      dispatch({
        type: TYPES.SET_ALERTS_DATA,
        payload: response.data,
      });
    }
  } catch (err) {
    console.error(err);
  }
  dispatch({ type: TYPES.COMPLETED });
};
