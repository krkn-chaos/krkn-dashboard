import * as TYPES from "@/actions/types";

const initialState = {
  container_id: "",
  pod_status: null,
  logs: [],
  podDetailsList: [],
  scenarioChecked: "pod-scenarios",
  isRootModalOpen: false,
  namsespaces: [],
  isPodmanInstalled: false,
  socketInstance: null,
  kubeConfigFile: "",
  configData: {},
  configDataArr: [],
  results: [],
};

const experimentReducer = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case TYPES.SET_DATA:
      return { ...state, container_id: payload.id };
    case TYPES.SET_POD_STATUS:
      return { ...state, pod_status: payload };
    case TYPES.SET_LOGS:
      return {
        ...state,
        logs: [...state.logs, ...payload.logs],
      };
    case TYPES.EMPTY_LOGS:
      return { ...state, logs: "" };
    case TYPES.SET_POD_DETAILS:
      return { ...state, podDetailsList: payload };
    case TYPES.CHECK_SCENARIO:
      return { ...state, scenarioChecked: payload };
    case TYPES.TOGGLE_ROOT_MODAL:
      return { ...state, isRootModalOpen: payload };
    case TYPES.SET_NAMESPACES:
      return {
        ...state,
        namsespaces: payload,
      };
    case TYPES.GET_PODMAN_STATUS:
      return { ...state, isPodmanInstalled: payload };
    case TYPES.SET_SOCKET_INSTANCE:
      return { ...state, socketInstance: payload };
    case TYPES.FILE_CONTENT:
      return { ...state, kubeConfigFile: payload };
    case TYPES.SAVE_CONFIG_DATA:
      return { ...state, configData: payload };
    case TYPES.SET_CONFIG_DATA:
      return { ...state, configDataArr: payload };
    case TYPES.SET_RESULTS:
      return { ...state, results: payload };
    default:
      return state;
  }
};

export default experimentReducer;
