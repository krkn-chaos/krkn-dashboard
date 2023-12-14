import * as TYPES from "@/actions/types";

const initialState = {
  container_id: "",
  pod_status: null,
  logs: "",
  podDetails: null,
  scenarioChecked: "pod-scenarios",
  isRootModalOpen: false,
  namsespaces: [],
  isPodmanInstalled: false,
  socketInstance: null,
};

const experimentReducer = (state = initialState, action) => {
  switch (action.type) {
    case TYPES.SET_DATA:
      return { ...state, container_id: action.payload.id };
    case TYPES.SET_POD_STATUS:
      return { ...state, pod_status: action.payload };
    case TYPES.SET_LOGS:
      return {
        ...state,
        logs: state.logs.concat(action.payload.logs),
      };
    case TYPES.EMPTY_LOGS:
      return { ...state, logs: "" };
    case TYPES.SET_POD_DETAILS:
      return { ...state, podDetails: action.payload };
    case TYPES.CHECK_SCENARIO:
      return { ...state, scenarioChecked: action.payload };
    case TYPES.TOGGLE_ROOT_MODAL:
      return { ...state, isRootModalOpen: action.payload };
    case TYPES.SET_NAMESPACES:
      return {
        ...state,
        namsespaces: action.payload,
      };
    case TYPES.GET_PODMAN_STATUS:
      return { ...state, isPodmanInstalled: action.payload };
    case TYPES.SET_SOCKET_INSTANCE:
      return { ...state, socketInstance: action.payload };
    default:
      return state;
  }
};

export default experimentReducer;
