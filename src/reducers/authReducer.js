import * as TYPES from "@/actions/types";

const initialState = {
  user: null,
  loading: true,
  kubeconfigs: [],
  groups: [],
  activeGroupId: null,
};

export default function authReducer(state = initialState, action) {
  switch (action.type) {
    case TYPES.AUTH_LOADING:
      return { ...state, loading: action.payload };
    case TYPES.AUTH_SET_USER:
      return {
        ...state,
        user: action.payload,
        loading: false,
        activeGroupId:
          action.payload?.groupIds?.[0] ?? state.activeGroupId ?? null,
      };
    case TYPES.AUTH_LOGOUT:
      return { ...initialState, loading: false };
    case TYPES.AUTH_SET_KUBECONFIGS:
      return { ...state, kubeconfigs: action.payload };
    case TYPES.AUTH_SET_GROUPS:
      return { ...state, groups: action.payload };
    case TYPES.AUTH_SET_ACTIVE_GROUP:
      return { ...state, activeGroupId: action.payload };
    default:
      return state;
  }
}
