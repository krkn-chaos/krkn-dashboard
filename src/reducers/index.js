import HeadReducer from "./headerReducer";
import LoadingReducer from "./loadingReducer";
import LogViewReducer from "./logViewReducer";
import ToastReducer from "./toastReducer";
import { combineReducers } from "redux";
import experimentReducer from "./experimentReducer";

export default combineReducers({
  experiment: experimentReducer,
  loading: LoadingReducer,
  toastReducer: ToastReducer,
  header: HeadReducer,
  log: LogViewReducer,
});
