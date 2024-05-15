import { TOGGLE_SIDE_MENU } from "./types";

export const toggleSideMenu = (value) => ({
  type: TOGGLE_SIDE_MENU,
  payload: value,
});
