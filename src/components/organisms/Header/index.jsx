import "./index.less";

import {
  Brand,
  Masthead,
  MastheadBrand,
  MastheadMain,
  MastheadToggle,
  PageToggleButton,
} from "@patternfly/react-core";
import { useDispatch, useSelector } from "react-redux";

import { BarsIcon } from "@patternfly/react-icons";
import React from "react";
import logo from "@/assets/logo/logo.png";
import { toggleSideMenu } from "@/actions/headerActions";

const Header = () => {
  const dispatch = useDispatch();
  const { isNavOpen } = useSelector((state) => state.header);
  const onNavToggle = () => {
    dispatch(toggleSideMenu());
  };
  return (
    <Masthead>
      <MastheadToggle>
        <PageToggleButton
          variant="plain"
          aria-label="Global navigation"
          isNavOpen={isNavOpen}
          onNavToggle={onNavToggle}
        >
          <BarsIcon />
        </PageToggleButton>
      </MastheadToggle>
      <MastheadMain>
        <MastheadBrand href="/">
          {import.meta.env.CONTAINER_BUILD ? (
            <Brand
              src={`${import.meta.env.CHAOS_ASSETS}/logo/logo.png`}
              className="header-logo"
              alt="kraken Logo"
            />
          ) : (
            <Brand src={logo} className="header-logo" alt="kraken Logo" />
          )}
        </MastheadBrand>
      </MastheadMain>
    </Masthead>
  );
};

export default Header;
