import React from "react";
import { SelectBasic } from "@/components/atoms/SelectBox/SelectBox";
import { useSelector } from "react-redux";

const LogsUI = () => {
  const { logs, podDetailsList } = useSelector((state) => state.experiment);

  return (
    <div className="logs-wrapper">
      <div className="margin-top">Select to view the logs</div>
      <SelectBasic options={podDetailsList} />
      <div className="logs-container">
        {logs && (
          <div id="logs">
            <div dangerouslySetInnerHTML={{ __html: logs }}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsUI;
