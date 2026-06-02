import { Nav, NavItem, NavList } from "@patternfly/react-core";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import { CatalogIcon } from "@patternfly/react-icons";
import { setActiveItem } from "@/actions/sideMenuActions.js";
import { pathForMenuKey } from "@/utils/navPaths";

const baseMenuOptions = [
  {
    key: "overview",
    displayName: "Run Kraken",
    icon: <CatalogIcon />,
    roles: ["admin", "user"],
  },
  {
    key: "past-runs",
    displayName: "Past Runs",
    icon: <CatalogIcon />,
    roles: ["admin", "user"],
  },
  {
    key: "elastic-runs",
    displayName: "Elastic Runs",
    icon: <CatalogIcon />,
    roles: ["admin", "user"],
  },
  {
    key: "settings",
    displayName: "Account Settings",
    icon: <CatalogIcon />,
    roles: ["admin", "user"],
  },
  {
    key: "administration",
    displayName: "Administration",
    icon: <CatalogIcon />,
    roles: ["admin"],
  },
];

const MenuOptions = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const activeMenuItem = useSelector((state) => state.header.activeMenuItem);
  const userRole = useSelector((state) => state.auth.user?.role);
  const sideMenuOptions = baseMenuOptions.filter(
    (o) => !userRole || o.roles.includes(userRole)
  );

  const goTo = (key) => {
    dispatch(setActiveItem(key));
    navigate(pathForMenuKey(key));
  };

  const onSelect = (_event, itemId) => {
    if (itemId) goTo(String(itemId));
  };

  useEffect(() => {
    const normalized = (pathname || "/").replace(/\/+$/, "") || "/";
    if (normalized === "/" || normalized === "") {
      dispatch(setActiveItem("overview"));
      return;
    }
    const segment = normalized.replace(/^\//, "").split("/")[0];
    dispatch(setActiveItem(segment || "overview"));
  }, [dispatch, pathname]);

  return (
    <Nav onSelect={onSelect}>
      <NavList>
        {sideMenuOptions.map((option) => (
          <NavItem
            key={option.key}
            itemId={option.key}
            isActive={activeMenuItem === option.key}
            onClick={() => goTo(option.key)}
          >
            {option.displayName}
          </NavItem>
        ))}
      </NavList>
    </Nav>
  );
};

export default MenuOptions;
