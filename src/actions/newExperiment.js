import * as TYPES from "./types";

import API from "@/utils/axiosInstance";
import Cookies from "universal-cookie";
import axios from "axios";
import { showToast } from "./toastActions";

export const startKraken = (data) => async (dispatch, getState) => {
  try {
    dispatch({ type: TYPES.LOADING });
    dispatch(removePod());
    const { kubeConfigFile } = getState().experiment;
    if (kubeConfigFile) {
      data["isFileUpload"] = true;
    }

    dispatch({
      type: TYPES.SET_POD_STATUS,
      payload: null,
    });
    const response = await API.post("/start-kraken", {
      params: data,
    });
    if (response.data.status === "200") {
      dispatch({
        type: TYPES.SAVE_CONFIG_DATA,
        payload: data,
      });
      dispatch({
        type: TYPES.SET_DATA,
        payload: response.data.message,
      });
      dispatch(getPodDetails());
      dispatch(showToast("success", "Kraken started successfully!"));
    } else {
      dispatch(showToast("danger", response.data.message));
    }
  } catch (error) {
    dispatch(showToast("danger", "Something went wrong", "Try again later"));
  }
  dispatch({ type: TYPES.COMPLETED });
};

export const saveConfig = () => async (dispatch, getState) => {
  try {
    const { configData } = getState().experiment;
    const data = { name: configData.name, params: configData };

    const response = await API.post("/saveConfig", {
      params: data,
    });
    if (response.data.status === 200) {
      dispatch(showToast("success", "Paramters saved!"));
    }
  } catch (error) {
    dispatch(showToast("danger", "Something went wrong", "Try again later"));
  }
};
export const getConfig = () => async (dispatch) => {
  try {
    const response = await API.get("/getConfig");
    if (response.data.status === 200) {
      dispatch({
        type: TYPES.SET_CONFIG_DATA,
        payload: response.data.message,
      });
    }
  } catch (error) {
    dispatch(showToast("danger", "Something went wrong", "Try again later"));
  }
};
export const deleteConfig = (id) => async (dispatch, getState) => {
  try {
    const response = await API.post("/deleteConfig", { params: id });
    const { configDataArr } = getState().experiment;
    if (response.data.status === 200) {
      const arr = configDataArr.filter((item) => item.id !== id);
      dispatch({
        type: TYPES.SET_CONFIG_DATA,
        payload: arr,
      });
      dispatch(showToast("success", "Config deleted!"));
    }
  } catch (error) {
    dispatch(showToast("danger", "Something went wrong", "Try again later"));
  }
};
export const removePod = () => async (dispatch) => {
  try {
    const response = await API.get("/removePod");
    if (response.data === "200") {
      dispatch({
        type: TYPES.SET_POD_STATUS,
        payload: null,
      });
      dispatch({
        type: TYPES.SET_LOGS,
        payload: {
          logs: "",
          errorLogs: "",
        },
      });
    }
  } catch (error) {
    dispatch(showToast("danger", "Something went wrong", "Try again later"));
  }
};

export const getPodStatus = (data) => async (dispatch) => {
  try {
    dispatch({
      type: TYPES.SET_POD_STATUS,
      payload: data.podStatus.trim(),
    });
  } catch (error) {
    dispatch(showToast("danger", "Something went wrong", "Try again later"));
  }
};

export const getLogs = (data) => async (dispatch) => {
  try {
    dispatch({ type: TYPES.LOADING });
    dispatch({
      type: TYPES.SET_LOGS,
      payload: {
        logs: data.toString().replaceAll(/\n/g, "<br />"),
        errorLogs: data,
      },
    });
  } catch (error) {
    dispatch(showToast("danger", "Something went wrong", "Try again later"));
  }

  dispatch({ type: TYPES.COMPLETED });
};

export const getPodDetails = () => async (dispatch, getState) => {
  try {
    const { socketInstance } = getState().experiment;
    socketInstance.emit("podStatus");
    socketInstance.on("podStatus", (data) => {
      dispatch({
        type: TYPES.SET_POD_DETAILS,
        payload: data[0],
      });
    });
  } catch (error) {
    dispatch(showToast("danger", "Something went wrong", "Try again later"));
  }
};

export const updateScenarioChecked = (scenario) => ({
  type: TYPES.CHECK_SCENARIO,
  payload: scenario,
});

export const checkForRootPassword = (isOpen) => (dispatch) => {
  const cookies = new Cookies(null, { path: "/" });
  if (!cookies.get("root-password")) {
    dispatch({ type: TYPES.TOGGLE_ROOT_MODAL, payload: true });
  } else {
    dispatch({ type: TYPES.TOGGLE_ROOT_MODAL, payload: isOpen });
  }
};

export const checkPodmanInstalled = () => async (dispatch) => {
  const response = await API.get("/getPodmanStatus");
  if (response.data.status === "success") {
    dispatch({ type: TYPES.GET_PODMAN_STATUS, payload: true });
  }
};

export const emptyLogs = () => ({
  type: TYPES.EMPTY_LOGS,
});

export const setSocketInstance = (socketInstance) => ({
  type: TYPES.SET_SOCKET_INSTANCE,
  payload: socketInstance,
});

export const updateFileContent = (content) => ({
  type: TYPES.FILE_CONTENT,
  payload: content,
});

export const fileUpload = (fileObj) => async (dispatch) => {
  try {
    dispatch({ type: TYPES.LOADING });
    const formData = new FormData();

    formData.append("files", fileObj);

    const response = await axios.post(
      "http://localhost:8000/uploadFile",
      formData,
      {
        headers: {
          "content-type": "multipart/form-data",
        },
      }
    );
    if (response.data.status === "200") {
      dispatch(showToast("success", "File uploaded successfully", ""));
    }
  } catch {
    dispatch(showToast("danger", "Something went wrong", "Try again later"));
  }
  dispatch({ type: TYPES.COMPLETED });
};
