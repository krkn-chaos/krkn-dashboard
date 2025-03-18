import { emptyLogs, logsFunc } from "@/actions/newExperiment";

import { SET_SELECTED_POD } from "./types";

export const setSelected = (selected) => (dispatch) => {
  dispatch(emptyLogs());
  dispatch({
    type: SET_SELECTED_POD,
    payload: selected,
  });
  dispatch(logsFunc(selected));
};
