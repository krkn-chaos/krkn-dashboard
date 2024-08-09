import { Nav, NavItem, NavList } from "@patternfly/react-core";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import { CatalogIcon } from "@patternfly/react-icons";
import { setActiveItem } from "@/actions/sideMenuActions.js";

const sideMenuOptions = [
  {
    id: 0,
    key: "overview",
    displayName: "Overview",
    icon: <CatalogIcon />,
  },
  {
    id: 1,
    key: "experiments",
    displayName: "Experiments",
    icon: <CatalogIcon />,
  },
  {
    id: 2,
    key: "results",
    displayName: "Results",
    icon: <CatalogIcon />,
  },
  {
    id: 3,
    key: "archives",
    displayName: "Archives",
    icon: <CatalogIcon />,
  },
];

const MenuOptions = () => {
  const dispatch = useDispatch();
  // const [activeItem, setActiveItem] = React.useState(0);

  const activeMenuItem = useSelector((state) => state.header.activeMenuItem);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const onSelect = (_event, itemId) => {
    const item = itemId;
    dispatch(setActiveItem(item));
  };

  useEffect(() => {
    if (pathname !== "/") {
      const currPath = pathname.replace(/^.*[/]([^/]+)[/]*$/, "$1");

      dispatch(setActiveItem(currPath));
    }
  }, [dispatch, pathname]);
  return (
    <>
      <Nav onSelect={onSelect}>
        <NavList>
          {sideMenuOptions.map((option) => {
            return (
              <NavItem
                key={option.key}
                itemId={option.id}
                isActive={activeMenuItem === option.id}
                onClick={() => navigate(option.key)}
              >
                {option.displayName}
              </NavItem>
            );
          })}
        </NavList>
      </Nav>
    </>
  );
};

export default MenuOptions;
