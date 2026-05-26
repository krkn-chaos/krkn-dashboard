import HeadReducer from "./headerReducer";
import LoadingReducer from "./loadingReducer";
import LogViewReducer from "./logViewReducer";
import StorageReducer from "./storageReducer";
import SummaryReducer from "./summaryReducer";
import ToastReducer from "./toastReducer";
import { combineReducers } from "redux";
import experimentReducer from "./experimentReducer";
import authReducer from "./authReducer";

export default combineReducers({
  auth: authReducer,
  experiment: experimentReducer,
  loading: LoadingReducer,
  toastReducer: ToastReducer,
  header: HeadReducer,
  log: LogViewReducer,
  storage: StorageReducer,
  summary: SummaryReducer,
});
