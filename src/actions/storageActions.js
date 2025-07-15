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
      dispatch({
        type: TYPES.SET_ES_CONNECTION_INFO,
        payload: {
          host: data.host,
          index: data.index,
          isConnected: true,
        },
      });
    }
  } catch (error) {
    dispatch({
      type: TYPES.SHOW_ES_CARD,
      payload: true,
    });
    dispatch({
      type: TYPES.SET_ES_CONNECTION_INFO,
      payload: {
        host: '',
        index: '',
        isConnected: false,
      },
    });
    dispatch(showToast("danger", "Something went wrong", "Try again later"));
  } finally {
    dispatch({ type: TYPES.COMPLETED });
  }
};

export const toggleAccordion = (isExpanded) => (dispatch) => {
  dispatch({ type: TYPES.SHOW_ES_CARD, payload: isExpanded });
};

export const disconnectES = () => (dispatch) => {
  dispatch({
    type: TYPES.SET_ES_CONNECTION_INFO,
    payload: {
      host: '',
      index: '',
      isConnected: false,
    },
  });
  dispatch({
    type: TYPES.SET_STORAGE_DATA,
    payload: [],
  });
  dispatch({
    type: TYPES.SHOW_ES_CARD,
    payload: true,
  });
  dispatch(showToast("info", "Disconnected from Elasticsearch"));
};
