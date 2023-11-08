import LoadingReducer from "./loadingReducer";
import ToastReducer from "./toastReducer";
import { combineReducers } from "redux";
import experimentReducer from "./experimentReducer";

export default combineReducers({
  experiment: experimentReducer,
  loading: LoadingReducer,
  toastReducer: ToastReducer,
});
