import { TOGGLE_SIDE_MENU } from "@/actions/types";

const initialState = {
  isNavOpen: true,
};

const HeadReducer = (state = initialState, action = {}) => {
  const { type } = action;
  switch (type) {
    case TOGGLE_SIDE_MENU:
      return {
        ...state,
        isNavOpen: !state.isNavOpen,
      };

    default:
      return state;
  }
};

export default HeadReducer;
