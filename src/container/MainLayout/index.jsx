import "./index.less";

import { Outlet, useNavigate } from "react-router-dom";
import { Page, PageSection } from "@patternfly/react-core";

import Header from "@/components/organisms/Header";
import LoadingComponent from "@/components/organisms/LoadingComponent";
import SideMenu from "@/components/organisms/SideMenu";
import ToastComponent from "@/components/organisms/ToastComponent";
import { useSelector } from "react-redux";

const MainLayout = () => {
  const navigate = useNavigate();
  const { alerts } = useSelector((state) => state.toastReducer);
  return (
    <>
      {alerts && alerts.length > 0 && <ToastComponent />}
      <Page header={<Header />} sidebar={<SideMenu />}>
        <PageSection isCenterAligned>
          <LoadingComponent>
            <Outlet context={navigate} />
          </LoadingComponent>
        </PageSection>
      </Page>
    </>
  );
};

export default MainLayout;
