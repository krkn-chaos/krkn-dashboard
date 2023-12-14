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
  emptyLogs,
  getLogs,
  getPodDetails,
  setSocketInstance,
} from "@/actions/newExperiment";
import { useDispatch, useSelector } from "react-redux";

import Cookies from "universal-cookie";
import DetailsTable from "../template/DetailsTable";
import LogsUI from "./LogsUI";
import NewExperiment from "@/components/NewExperiment";
import RootPasswordModal from "@/components/molecules/PasswordModal";
import ScenariosCard from "@/components/template/ScenariosCard";
import socketIOClient from "socket.io-client";

const Overview = () => {
  const dispatch = useDispatch();

  const [activeTabKey, setActiveTabKey] = useState(0);

  const [socket, setSocket] = useState(null);

  const { isPodmanInstalled } = useSelector((state) => state.experiment);

  const cookies = new Cookies(null, { path: "/" });
  const passwd = cookies.get("root-password");

  const handleTabClick = (_event, tabIndex) => {
    setActiveTabKey(tabIndex);
    if (tabIndex === 1) {
      dispatch(emptyLogs());
      socket.emit("logs", passwd);
      socket.on("logs", (data) => {
        dispatch(getLogs(data));
      });
    }
  };
  useEffect(() => {
    const socketInstance = socketIOClient("http://localhost:8000", {
      extraHeaders: {
        passwd: passwd,
      },
    });
    setSocket(socketInstance);
    dispatch(setSocketInstance(socketInstance));

    if (isPodmanInstalled) {
      dispatch(checkForRootPassword(false));
      dispatch(getPodDetails());
    }
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [dispatch, isPodmanInstalled]);

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
