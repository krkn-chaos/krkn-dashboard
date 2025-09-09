import * as TYPES from "./types";

import API from "@/utils/axiosInstance";
import { appendQueryString } from "@/utils/helper.js";
import { cloneDeep } from "lodash";
import { showToast } from "./toastActions";

export const esConnect = (data) => async (dispatch, getState) => {
  try {
    dispatch({ type: TYPES.LOADING });
    dispatch({
      type: TYPES.SET_STORAGE_DATA,
      payload: [],
    });
    const state = getState().storage;
    const {
      start_date,
      end_date,
      size,
      offset,
      appliedFilters,
      connectionInfo,
    } = state;
    const response = await API.post("/connect-es", {
      params: {
        ...data,
        size,
        offset,
        start_date: start_date,
        end_date: end_date,
        ...(appliedFilters && { filters: appliedFilters }),
      },
    });
    if (response.data.status === 200) {
      if (!connectionInfo.isConnected) {
        dispatch(showToast("success", "Connected to the instance"));
      }
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
          username: data.username,
          password: data.password,
        },
      });
      dispatch({
        type: TYPES.SET_FILTER_DATA,
        payload: response.data.results.filters,
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
        host: "",
        index: "",
        isConnected: false,
      },
    });

    const errorMessage =
      error.response?.data?.message || error.message || "Something went wrong";
    dispatch(showToast("danger", "Connection failed", errorMessage));
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
      host: "",
      index: "",
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

export const setDateRange = (start_date, end_date) => (dispatch) => {
  dispatch({
    type: TYPES.SET_DATE_RANGE,
    payload: { start_date, end_date },
  });
  dispatch(fetchStorageData());
};

export const setPage = (pageNo) => ({
  type: TYPES.SET_METRICS_PAGE,
  payload: pageNo,
});

export const setPageOptions = (page, perPage) => ({
  type: TYPES.SET_METRICS_PAGE_OPTIONS,
  payload: { page, perPage },
});
export const setPagination = (page, size) => (dispatch) => {
  dispatch({
    type: TYPES.SET_PAGINATION,
    payload: { page, size },
  });
};

export const fetchStorageData = () => async (dispatch, getState) => {
  try {
    dispatch({ type: TYPES.LOADING });

    const state = getState().storage;
    const { start_date, end_date, size, offset, connectionInfo } = state;

    const response = await API.post("/connect-es", {
      params: {
        ...connectionInfo,
        start_date: start_date,
        end_date: end_date,
        size,
        offset,
      },
    });

    if (response.data.status === 200) {
      dispatch({
        type: TYPES.SET_STORAGE_DATA,
        payload: response.data.results,
      });
    }
  } catch (error) {
    dispatch(showToast("danger", "Failed to fetch data", "Try again later"));
  } finally {
    dispatch({ type: TYPES.COMPLETED });
  }
};
export const getSelectedFilter =
  (selectedCategory, selectedOption) => (dispatch, getState) => {
    const selectedFilters = cloneDeep(getState().storage.selectedFilters);

    const obj = selectedFilters.find((i) => i.name === selectedCategory);

    const objValue = obj.value;
    if (objValue.includes(selectedOption)) {
      const arr = objValue.filter((selection) => selection !== selectedOption);
      obj.value = arr;
    } else {
      obj.value = [...obj.value, selectedOption];
    }

    return selectedFilters;
  };
export const setCatFilters = (category) => (dispatch, getState) => {
  const filterData = [...getState().storage.filterData];
  const options = filterData.filter((item) => item.name === category)[0].value;
  const list = options.map((item) => ({ name: item, value: item }));

  dispatch({
    type: TYPES.SET_CATEGORY_FILTER,
    payload: category,
  });
  dispatch({
    type: TYPES.SET_FILTER_OPTIONS,
    payload: list,
  });
};

export const setSelectedFilter =
  (selectedCategory, selectedOption) => (dispatch) => {
    const selectedFilters = dispatch(
      getSelectedFilter(selectedCategory, selectedOption)
    );
    dispatch({
      type: TYPES.SET_SELECTED_FILTERS,
      payload: selectedFilters,
    });
  };
export const setAppliedFilters = (navigate) => (dispatch, getState) => {
  const { start_date, end_date, selectedFilters, connectionInfo } =
    getState().storage;
  const appliedFilterArr = selectedFilters.filter((i) => i.value.length > 0);

  const appliedFilters = {};
  appliedFilterArr.forEach((item) => {
    appliedFilters[item["name"]] = item.value;
  });

  dispatch({
    type: TYPES.SET_APPLIED_FILTERS,
    payload: appliedFilters,
  });
  appendQueryString({ ...appliedFilters, start_date, end_date }, navigate);
  // dispatch(applyFilters());

  dispatch(esConnect(connectionInfo));
};
