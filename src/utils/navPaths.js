import * as APP_ROUTES from "./routeConstants";

/** Absolute app paths for react-router (avoids relative navigate bugs). */
export function pathForMenuKey(key) {
  if (key === APP_ROUTES.OVERVIEW || key === "" || key === "/") {
    return "/";
  }
  return `/${key}`;
}
