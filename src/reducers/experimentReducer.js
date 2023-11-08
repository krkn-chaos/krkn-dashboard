import * as TYPES from "@/actions/types";

const initialState = {
  container_id: "",
  pod_status: null,
  logs: "",
  errorLogs: "",
  podDetails: null,
  scenarioChecked: "pod-scenarios",
  isRootModalOpen: false,
  namsespaces: [],
  isPodmanInstalled: false,
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
        logs: action.payload.logs,
        errorLogs: action.payload.errorLogs,
      };
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
    default:
      return state;
  }
};

export default experimentReducer;
