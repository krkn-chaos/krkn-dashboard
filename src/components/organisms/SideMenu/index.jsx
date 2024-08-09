import { PageSidebar, PageSidebarBody } from "@patternfly/react-core";

import MenuOptions from "@/components/molecules/SideMenuOptions/index";
import React from "react";
import { useSelector } from "react-redux";

const SideMenu = () => {
  const { isNavOpen } = useSelector((state) => state.header);

  return (
    <PageSidebar
      nav={<MenuOptions />}
      isNavOpen={isNavOpen}
      id="dashboard-sidemenu"
    >
      <PageSidebarBody>
        <MenuOptions />
      </PageSidebarBody>
    </PageSidebar>
  );
};

export default SideMenu;
