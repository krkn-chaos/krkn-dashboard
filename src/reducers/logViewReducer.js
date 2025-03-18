import { SET_SELECTED_POD } from "@/actions/types";

const initialState = {
  selectedPod: "",
};

const LogViewReducer = (state = initialState, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case SET_SELECTED_POD:
      return {
        ...state,
        selectedPod: payload,
      };

    default:
      return state;
  }
};

export default LogViewReducer;
