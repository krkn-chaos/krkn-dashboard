import * as TYPES from "@/actions/types";

const initialState = {
  results: [],
  isExpanded: false,
  connectionInfo: {
    host: '',
    index: '',
    isConnected: false,
  },
};

const StorageReducer = (state = initialState, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case TYPES.SET_STORAGE_DATA: {
      return { ...state, results: payload };
    }
    case TYPES.SHOW_ES_CARD: {
      return { ...state, isExpanded: payload };
    }
    case TYPES.SET_ES_CONNECTION_INFO: {
      return { ...state, connectionInfo: payload };
    }
    default:
      return state;
  }
};

export default StorageReducer;
