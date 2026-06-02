import * as TYPES from "./types";

import API from "@/utils/axiosInstance";
import { showToast } from "./toastActions";

export const fetchCurrentUser = () => async (dispatch) => {
  try {
    dispatch({ type: TYPES.AUTH_LOADING, payload: true });
    const res = await API.get("/auth/me");
    dispatch({ type: TYPES.AUTH_SET_USER, payload: res.data.user });
    return res.data.user;
  } catch {
    dispatch({ type: TYPES.AUTH_LOGOUT });
    return null;
  }
};

export const login =
  (username, password) => async (dispatch) => {
    try {
      dispatch({ type: TYPES.AUTH_LOADING, payload: true });
      const res = await API.post("/auth/login", { username, password });
      dispatch({ type: TYPES.AUTH_SET_USER, payload: res.data.user });
      dispatch(showToast("success", "Signed in"));
      return res.data.user;
    } catch (error) {
      dispatch({ type: TYPES.AUTH_LOADING, payload: false });
      throw error;
    }
  };

export const logout = () => async (dispatch) => {
  try {
    await API.post("/auth/logout");
  } catch {
    /* ignore */
  }
  dispatch({ type: TYPES.AUTH_LOGOUT });
};

export const changePassword =
  (currentPassword, newPassword) => async (dispatch) => {
    const res = await API.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    dispatch({ type: TYPES.AUTH_SET_USER, payload: res.data.user });
    dispatch(showToast("success", "Password updated"));
    return res.data.user;
  };

export const updateAccount =
  ({ username, currentPassword, newPassword }) => async (dispatch) => {
    const body = {};
    if (username !== undefined) body.username = username;
    if (currentPassword !== undefined) body.currentPassword = currentPassword;
    if (newPassword !== undefined) body.newPassword = newPassword;
    const res = await API.patch("/auth/me", body);
    dispatch({ type: TYPES.AUTH_SET_USER, payload: res.data.user });
    dispatch(showToast("success", "Account updated"));
    return res.data.user;
  };

export const fetchKubeconfigs =
  (groupId = null) => async (dispatch) => {
    const params = groupId != null ? { groupId } : {};
    const res = await API.get("/auth/kubeconfigs", { params });
    dispatch({ type: TYPES.AUTH_SET_KUBECONFIGS, payload: res.data.kubeconfigs });
    return res.data.kubeconfigs;
  };

export const fetchAdminGroups = () => async (dispatch) => {
  const res = await API.get("/auth/groups");
  dispatch({ type: TYPES.AUTH_SET_GROUPS, payload: res.data.groups });
  return res.data.groups;
};

/** Groups the user may run experiments in (all groups for platform admin). */
export const fetchRunGroups = () => async (dispatch, getState) => {
  const user = getState().auth.user;
  if (!user) return [];
  const path = user.role === "admin" ? "/auth/groups" : "/auth/groups/mine";
  const res = await API.get(path);
  const groups = res.data.groups || [];
  dispatch({ type: TYPES.AUTH_SET_GROUPS, payload: groups });
  const validIds = groups.map((g) => g.id);
  const { activeGroupId } = getState().auth;
  if (!activeGroupId || !validIds.includes(activeGroupId)) {
    dispatch({
      type: TYPES.AUTH_SET_ACTIVE_GROUP,
      payload: groups[0]?.id ?? null,
    });
  }
  return groups;
};

export const setActiveGroupId = (groupId) => ({
  type: TYPES.AUTH_SET_ACTIVE_GROUP,
  payload: groupId,
});
