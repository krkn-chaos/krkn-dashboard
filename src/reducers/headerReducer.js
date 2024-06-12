import { SET_ACTIVE_MENU_ITEM, TOGGLE_SIDE_MENU } from "@/actions/types";

const initialState = {
  isNavOpen: true,
  activeMenuItem: "overview",
};

const HeadReducer = (state = initialState, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case TOGGLE_SIDE_MENU:
      return {
        ...state,
        isNavOpen: !state.isNavOpen,
      };
    case SET_ACTIVE_MENU_ITEM:
      return {
        ...state,
        activeMenuItem: payload,
      };
    default:
      return state;
  }
};

export default HeadReducer;
