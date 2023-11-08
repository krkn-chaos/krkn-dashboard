import MenuOptions from "@/components/molecules/SideMenuOptions/index";
import { PageSidebar } from "@patternfly/react-core";
import React from "react";

const SideMenu = () => {
  const isNavOpen = true;

  return (
    <PageSidebar
      nav={<MenuOptions />}
      isNavOpen={isNavOpen}
      id="dashboard-sidemenu"
    />
  );
};

export default SideMenu;
