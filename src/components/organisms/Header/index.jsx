import "./index.less";

import {
  Brand,
  Masthead,
  MastheadBrand,
  MastheadMain,
  MastheadToggle,
  PageToggleButton,
} from "@patternfly/react-core";
import React, { useState } from "react";

import { BarsIcon } from "@patternfly/react-icons";
import logo from "@/assets/logo/logo.png";

const Header = () => {
  const [isNavOpen, setIsNavOpen] = useState(true);
  const onNavToggle = () => {
    setIsNavOpen(!isNavOpen);
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
