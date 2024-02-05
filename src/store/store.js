import { applyMiddleware, compose, createStore } from "redux";

import { createLogger } from "redux-logger";
import reducer from "@/reducers/index";
import thunkMiddleware from "redux-thunk";

const composeEnhancers =
  typeof window === "object" && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
        // Specify extension’s options like name, actionsBlacklist, actionsCreators, serialize...
      })
    : compose;

const enhancers = composeEnhancers(
  applyMiddleware(thunkMiddleware, createLogger()),
);

const store = createStore(reducer, enhancers);

export default store;
