import "./index.less";

import {
  Card,
  CardBody,
  Tab,
  TabTitleText,
  Tabs,
  Title,
} from "@patternfly/react-core";
import React, { useEffect, useState } from "react";
import {
  checkForRootPassword,
  getPodDetails,
  setSocketInstance,
} from "@/actions/newExperiment";
import { useDispatch, useSelector } from "react-redux";

import Cookies from "universal-cookie";
import DetailsTable from "../template/DetailsTable/DetailsTable";
import LogsUI from "./LogsUI";
import NewExperiment from "@/components/NewExperiment";
import RootPasswordModal from "@/components/molecules/PasswordModal";
import ScenariosCard from "@/components/template/ScenariosCard";
import socketIOClient from "socket.io-client";
import { useInterval } from "@/utils/hooks";

const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
const wsHost = window.location.hostname;
const wsPort = 8000;

const Overview = () => {
  const dispatch = useDispatch();

  const [activeTabKey, setActiveTabKey] = useState(0);
  const [pollingInterval, setPollingInterval] = useState(6000);

  const { isPodmanInstalled, podDetailsList } = useSelector(
    (state) => state.experiment
  );

  const cookies = new Cookies(null, { path: "/" });
  const passwd = cookies.get("root-password");

  const handleTabClick = (_event, tabIndex) => {
    setActiveTabKey(tabIndex);
  };
  useEffect(() => {
    const socketInstance = socketIOClient.io(
      `${wsProtocol}://${wsHost}:${wsPort}`,
      {
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 4000,
        reconnectionDelayMax: 5000,
        transports: ["websocket"],
        extraHeaders: {
          passwd: passwd,
        },
      }
    );

    dispatch(setSocketInstance(socketInstance));

    if (isPodmanInstalled) {
      dispatch(checkForRootPassword(false));
    }
    if (isPodmanInstalled && passwd) {
      dispatch(getPodDetails());
    }
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [dispatch, isPodmanInstalled]);

  useEffect(() => {
    const runningPods = podDetailsList.filter(
      (item) => item.State !== "exited"
    );

    setPollingInterval(runningPods.length > 0 ? 6000 : null);
  }, [podDetailsList]);

  useInterval(() => {
    if (isPodmanInstalled && passwd) {
      dispatch(getPodDetails());
    }
  }, pollingInterval);

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
