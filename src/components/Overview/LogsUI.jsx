import { Card, CardBody } from "@patternfly/react-core";

import React from "react";
import { useSelector } from "react-redux";

const LogsUI = () => {
  const { logs } = useSelector((state) => state.experiment);

  return (
    <Card>
      <CardBody>
        {logs && (
          <div id="logs">
            <div dangerouslySetInnerHTML={{ __html: logs }}></div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default LogsUI;
