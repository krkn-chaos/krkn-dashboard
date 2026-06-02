import "./index.less";

import {
  Brand,
  Button,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadMain,
  MastheadToggle,
  PageToggleButton,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { useDispatch, useSelector } from "react-redux";

import { BarsIcon, UserIcon } from "@patternfly/react-icons";
import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo/logo.png";
import * as APP_ROUTES from "@/utils/routeConstants";
import { pathForMenuKey } from "@/utils/navPaths";
import { toggleSideMenu } from "@/actions/headerActions";
import { logout } from "@/actions/authActions";
import { setActiveItem } from "@/actions/sideMenuActions";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isNavOpen } = useSelector((state) => state.header);
  const user = useSelector((state) => state.auth.user);

  const onNavToggle = () => {
    dispatch(toggleSideMenu());
  };

  const openSettings = () => {
    dispatch(setActiveItem(APP_ROUTES.SETTINGS));
    navigate(pathForMenuKey(APP_ROUTES.SETTINGS));
  };

  return (
    <Masthead className="dashboard-masthead">
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
        <MastheadBrand
          href="/"
          onClick={(e) => {
            e.preventDefault();
            dispatch(setActiveItem(APP_ROUTES.OVERVIEW));
            navigate("/");
          }}
        >
          {import.meta.env.EXTERNAL_CONTAINER_BUILD ? (
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
      {user ? (
        <MastheadContent>
          <Toolbar className="header-toolbar" inset={{ default: "insetNone" }}>
            <ToolbarContent align={{ default: "alignEnd" }}>
              <ToolbarItem>
                <Button
                  variant="plain"
                  className="header-user-icon"
                  aria-label={`${user.username} — open account settings`}
                  onClick={openSettings}
                >
                  <UserIcon aria-hidden />
                </Button>
              </ToolbarItem>
              <ToolbarItem>
                <Button
                  variant="link"
                  className="header-sign-out"
                  onClick={() => {
                    dispatch(logout());
                    navigate("/login");
                  }}
                >
                  Sign out
                </Button>
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>
        </MastheadContent>
      ) : null}
    </Masthead>
  );
};

export default Header;
