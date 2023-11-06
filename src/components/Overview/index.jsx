import "./index.less";

import {
  Card,
  CardBody,
  Switch,
  Tab,
  TabTitleText,
  Tabs,
  Title,
} from "@patternfly/react-core";
import React, { useEffect, useState } from "react";
import {
  checkForRootPassword,
  getLogs,
  getPodDetails,
  getPodStatus,
} from "@/actions/newExperiment";
import { useDispatch, useSelector } from "react-redux";

import DetailsTable from "../template/DetailsTable";
import { IconButton } from "@/components/atoms/Buttons/Buttons";
import LogsUI from "./LogsUI";
import NewExperiment from "@/components/NewExperiment";
import { OutlinedCompassIcon } from "@patternfly/react-icons";
import PODStatus from "./PODStatus";
import RootPasswordModal from "@/components/molecules/PasswordModal";
import ScenariosCard from "@/components/template/ScenariosCard";
import { useInterval } from "@/utils/hooks";

const Overview = () => {
  const dispatch = useDispatch();

  const [activeTabKey, setActiveTabKey] = useState(0);
  const [isChecked, setIsChecked] = useState(true);
  const { pod_status } = useSelector((state) => state.experiment);

  const handleTabClick = (event, tabIndex) => {
    setActiveTabKey(tabIndex);
    if (tabIndex === 1) {
      dispatch(getLogs());
    }
  };
  const handleSwitchChange = (checked) => {
    setIsChecked(checked);
  };

  useInterval(
    () => {
      dispatch(getPodDetails());
      dispatch(getPodStatus());
    },
    isChecked ? 6000 : null
  );

  useEffect(() => {
    dispatch(checkForRootPassword(false));
    dispatch(getPodDetails());
  }, [dispatch]);

  return (
    <div className="overview-wrapper">
      <Card className="overview-card">
        <Tabs activeKey={activeTabKey} isBox={false} onSelect={handleTabClick}>
          <Tab eventKey={0} title={<TabTitleText>Kraken</TabTitleText>}>
            <div className="top-bar">
              <ScenariosCard />
              <NewExperiment />

              <Card isRounded className="status-container margin-top">
                <CardBody>
                  <Title headingLevel="h3" className="title-text">
                    Pod Details
                  </Title>
                  <div className="status-card-wrapper">
                    {/* <Switch
                      id="auto-update"
                      label="Auto Update"
                      isChecked={isChecked}
                      onChange={handleSwitchChange}
                      ouiaId="Auto update switch"
                    /> */}
                    {!pod_status && (
                      <IconButton
                        variant="link"
                        icon={<OutlinedCompassIcon />}
                        text={" Get Status"}
                        position={"right"}
                        clickHandler={() => dispatch(getPodStatus())}
                      />
                    )}
                    <PODStatus />
                  </div>
                  <DetailsTable />
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab eventKey={1} title={<TabTitleText>Logs</TabTitleText>}>
            <LogsUI />
          </Tab>
        </Tabs>
        <RootPasswordModal />
      </Card>
    </div>
  );
};

export default Overview;
