import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@patternfly/react-icons";

import { Label } from "@patternfly/react-core";
import React from "react";

const PODStatus = (props) => {
  const message = props?.pod_status === 0 ? "Pass" : "Fail";
  const statusClass = props?.pod_status === 0 ? "passClass" : "failClass";

  return (
    <>
      {props?.pod_status !== null && (
        <div className="pod-status-class">
          {/* <div>
            <span className={`icon-class ${statusClass}`}>
              {statusClass === "passClass" ? (
                <CheckCircleIcon />
              ) : (
                <ExclamationCircleIcon />
              )}
            </span>
            {message}
          </div> */}
          {statusClass === "passClass" ? (
            <Label variant="outline" color={"green"} icon={<CheckCircleIcon />}>
              {message}
            </Label>
          ) : (
            <Label
              variant="outline"
              color={"red"}
              icon={<ExclamationCircleIcon />}
            >
              {message}
            </Label>
          )}
        </div>
      )}
    </>
  );
};

export default PODStatus;
