import "./index.less";

import { Card, CardBody, Title } from "@patternfly/react-core";
import React, { useEffect, useMemo } from "react";
import { getPodDetails, setSocketInstance } from "@/actions/newExperiment";
import { useDispatch, useSelector } from "react-redux";

import NewExperiment from "@/components/NewExperiment";
import RunningContainersTable from "@/components/Overview/RunningContainersTable";
import ScenariosCard from "@/components/template/ScenariosCard";
import socketIOClient from "socket.io-client";
import { useInterval } from "@/utils/hooks";

const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
const wsHost = window.location.hostname;
const wsPort = 8000;

const Overview = () => {
  const dispatch = useDispatch();

  const { isPodmanInstalled, podDetailsList } = useSelector(
    (state) => state.experiment
  );

  const runningPods = useMemo(
    () =>
      podDetailsList.filter(
        (p) => (p.State || "").toLowerCase() === "running"
      ),
    [podDetailsList]
  );

  useEffect(() => {
    const socketInstance = socketIOClient.io(
      `${wsProtocol}://${wsHost}:${wsPort}`,
      {
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 4000,
        reconnectionDelayMax: 5000,
        transports: ["websocket"],
        extraHeaders: {},
      }
    );

    dispatch(setSocketInstance(socketInstance));

    if (isPodmanInstalled) {
      dispatch(getPodDetails());
    }
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [dispatch, isPodmanInstalled]);

  useInterval(() => {
    if (isPodmanInstalled) {
      dispatch(getPodDetails());
    }
  }, isPodmanInstalled ? 6000 : null);

  return (
    <div className="overview-wrapper">
      <Card className="overview-card">
        <CardBody>
          <Title headingLevel="h2" className="title-text pf-v5-u-mb-md">
            Run Kraken
          </Title>
          <div className="top-bar">
            <ScenariosCard />
            <NewExperiment />
          </div>
          <RunningContainersTable pods={runningPods} />
        </CardBody>
      </Card>
    </div>
  );
};

export default Overview;
