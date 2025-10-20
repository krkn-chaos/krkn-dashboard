import * as TYPES from "@/actions/types";

import { formatDate } from "@/utils/helper";

// Calculate start_date as 5 days before today
const getStartDate = () => {
  const today = new Date();
  const fiveDaysAgo = new Date(today);
  fiveDaysAgo.setDate(today.getDate() - 5);
  return formatDate(fiveDaysAgo);
};

const initialState = {
  results: [],
  isExpanded: true,
  start_date: getStartDate(),
  end_date: formatDate(new Date()),
  size: 25,
  offset: 0,
  pagination: {
    total: 0,
    currentPage: 1,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  },
  filterData: [],
  connectionInfo: {
    host: "",
    index: "",
    isConnected: false,
  },
  tableFilters: [
    { name: "Status", value: "job_status" },
    { name: "Cloud Infrastructure", value: "cloud_infrastructure" },
    { name: "Cloud Type", value: "cloud_type" },
    { name: "Version", value: "major_version" },
  ],
  selectedFilters: [
    { name: "job_status", value: [] },
    { name: "cloud_infrastructure", value: [] },
    { name: "major_version", value: [] },
    { name: "cloud_type", value: [] },
  ],
  categoryFilterValue: "",
  filterOptions: [],
  appliedFilters: {},
};

const StorageReducer = (state = initialState, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case TYPES.SET_STORAGE_DATA: {
      return {
        ...state,
        results: payload.data || payload,
        pagination: payload.pagination || state.pagination,
      };
    }
    case TYPES.SHOW_ES_CARD: {
      return { ...state, isExpanded: payload };
    }
    case TYPES.SET_ES_CONNECTION_INFO: {
      return { ...state, connectionInfo: payload };
    }
    case TYPES.SET_DATE_RANGE: {
      return {
        ...state,
        start_date: payload.start_date,
        end_date: payload.end_date,
        offset: 0, // Reset to first page when date range changes
      };
    }
    case TYPES.SET_PAGINATION: {
      const newOffset = payload.page
        ? (payload.page - 1) * state.size
        : payload.offset;
      return {
        ...state,
        offset: newOffset,
        size: payload.size || state.size,
      };
    }
    case TYPES.NEXT_PAGE: {
      const newOffset = state.offset + state.size;
      return {
        ...state,
        offset: newOffset,
      };
    }
    case TYPES.PREVIOUS_PAGE: {
      const newOffset = Math.max(0, state.offset - state.size);
      return {
        ...state,
        offset: newOffset,
      };
    }
    case TYPES.SET_METRICS_PAGE_OPTIONS:
      return {
        ...state,
        size: payload.perPage,
        pagination: {
          ...state.pagination,
          currentPage: payload,
        },
      };
    case TYPES.SET_METRICS_PAGE:
      return {
        ...state,
        pagination: {
          ...state.pagination,
          currentPage: payload,
        },
      };
    case TYPES.SET_CATEGORY_FILTER:
      return { ...state, categoryFilterValue: payload };
    case TYPES.SET_FILTER_DATA:
      return { ...state, filterData: payload };
    case TYPES.SET_FILTER_OPTIONS:
      return { ...state, filterOptions: payload };
    case TYPES.SET_SELECTED_FILTERS:
      return { ...state, selectedFilters: payload };
    case TYPES.SET_APPLIED_FILTERS:
      return { ...state, appliedFilters: payload };
    default:
      return state;
  }
};

export default StorageReducer;
