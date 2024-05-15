import MenuOptions from "@/components/molecules/SideMenuOptions/index";
import { PageSidebar } from "@patternfly/react-core";
import React from "react";
import { useSelector } from "react-redux";

const SideMenu = () => {
  const { isNavOpen } = useSelector((state) => state.header);

  return (
    <PageSidebar
      nav={<MenuOptions />}
      isNavOpen={isNavOpen}
      id="dashboard-sidemenu"
    />
  );
};

export default SideMenu;
