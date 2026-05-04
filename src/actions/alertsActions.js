import API from "@/utils/axiosInstance";
import * as TYPES from "./types";

export const fetchAlertsData = () => async (dispatch, getState) => {
  try {
    dispatch({ type: TYPES.LOADING });
    const state = getState().storage;
    const { start_date, end_date } = getState().summary;
    const size = 25;
    const offset = 0;
    const { connectionInfo } = state;
    const response = await API.post("/alertsAnalysis", {
      params: {
        ...connectionInfo,
        size,
        offset,
        start_date,
        end_date,
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
