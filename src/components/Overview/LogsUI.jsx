import React from "react";
import { SelectBasic } from "@/components/atoms/SelectBox/SelectBox";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { useSelector } from "react-redux";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
const LogsUI = () => {
  const { logs, podDetailsList } = useSelector((state) => state.experiment);

  return (
    <div className="logs-wrapper">
      <div className="margin-top">Select to view the logs</div>
      <SelectBasic options={podDetailsList} />
      <div className="logs-container">
        {/* {logs && (
          <div id="logs">
            <div dangerouslySetInnerHTML={{ __html: logs }}></div>
          </div>
        )} */}
        {logs.split("\n").map((log, index) => {
          try {
            const parsedLog = JSON.parse(log);
            return (
              <SyntaxHighlighter
                key={index}
                language="json"
                style={vscDarkPlus}
              >
                {JSON.stringify(parsedLog, null, 2)}
              </SyntaxHighlighter>
            );
          } catch {
            return (
              <div id="logs">
                <div dangerouslySetInnerHTML={{ __html: logs }}></div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};

export default LogsUI;
