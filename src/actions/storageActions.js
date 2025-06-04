import * as TYPES from "./types";

import API from "@/utils/axiosInstance";
import { showToast } from "./toastActions";

export const esConnect = (data) => async (dispatch) => {
  try {
    dispatch({ type: TYPES.LOADING });
    dispatch({
      type: TYPES.SET_STORAGE_DATA,
      payload: [],
    });
    const response = await API.post("/connect-es", {
      params: data,
    });
    if (response.data.status === 200) {
      dispatch(showToast("success", "Connected to the instance"));
      dispatch({
        type: TYPES.SHOW_ES_CARD,
        payload: false,
      });
      dispatch({
        type: TYPES.SET_STORAGE_DATA,
        payload: response.data.results,
      });
    }
  } catch (error) {
    dispatch({
      type: TYPES.SHOW_ES_CARD,
      payload: true,
    });
    dispatch(showToast("danger", "Something went wrong", "Try again later"));
  } finally {
    dispatch({ type: TYPES.COMPLETED });
  }
};

export const toggleAccordion = (isExpanded) => (dispatch) => {
  dispatch({ type: TYPES.SHOW_ES_CARD, payload: isExpanded });
};
