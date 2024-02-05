import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@patternfly/react-icons";

import React from "react";

const PODStatus = (props) => {
  const message = props.pod_status === "0" ? "Pass" : "Fail";
  const statusClass = props.pod_status === "0" ? "passClass" : "failClass";

  return (
    <>
      {props.pod_status !== null && (
        <div className="pod-status-class">
          <div>
            <span className={`icon-class ${statusClass}`}>
              {statusClass === "passClass" ? (
                <CheckCircleIcon />
              ) : (
                <ExclamationCircleIcon />
              )}
            </span>
            {message}
          </div>
        </div>
      )}
    </>
  );
};

export default PODStatus;
