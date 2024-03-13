import { Nav, NavItem, NavList } from "@patternfly/react-core";

import { CatalogIcon } from "@patternfly/react-icons";
import React from "react";

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
  // {
  //   id: 2,
  //   key: "events",
  //   displayName: "Events",
  //   icon: <CatalogIcon />,
  // },
  {
    id: 3,
    key: "archives",
    displayName: "Archives",
    icon: <CatalogIcon />,
  },
];

const MenuOptions = () => {
  const [activeItem, setActiveItem] = React.useState(0);
  const onSelect = (_event, itemId) => {
    const item = itemId;
    setActiveItem(item);
  };

  return (
    <>
      <Nav onSelect={onSelect}>
        <NavList>
          {sideMenuOptions.map((option) => {
            return (
              <NavItem
                key={option.key}
                itemId={option.id}
                isActive={activeItem === option.id}
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
