import { Card, CardBody } from "@patternfly/react-core";

import React from "react";
import { useSelector } from "react-redux";

const PODStatus = () => {
  const { pod_status } = useSelector((state) => state.experiment);

  const message = pod_status === "0" ? "Pass" : "Fail";
  const statusClass = pod_status === "0" ? "passClass" : "failClass";
  return (
    <>
      {pod_status !== null && (
        <Card className={`status-card ${statusClass}`}>
          <CardBody className={statusClass}>
            <div>{message}</div>
          </CardBody>
        </Card>
      )}
    </>
  );
};

export default PODStatus;
