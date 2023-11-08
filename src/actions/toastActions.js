import * as TYPES from "./types";

export const uid = () => {
  const head = Date.now().toString(36);
  const tail = Math.random().toString(36).substring(2);

  return head + tail;
};

export const showFailureToast = () => async (dispatch) => {
  const toast = {
    variant: "danger",
    title: "Something went wrong",
    message: "Please try again later",
  };
  dispatch(showToast(toast.variant, toast.title, toast.message));
};

export const showToast =
  (variant, title, message = "") =>
  (dispatch, getState) => {
    const obj = {
      variant: variant,
      title: title,
      message: message,
      key: uid(),
    };
    const alerts = [...getState().toastReducer.alerts, obj];

    dispatch({
      type: TYPES.SHOW_TOAST,
      payload: alerts,
    });
  };

export const hideToast = (key) => (dispatch, getState) => {
  const alerts = getState().toastReducer.alerts;
  const activeAlert = alerts.filter((item) => item.key !== key);

  dispatch({
    type: TYPES.SHOW_TOAST,
    payload: activeAlert,
  });
};

export const clearToast = () => (dispatch) => {
  dispatch({ type: TYPES.CLEAR_TOAST });
};
