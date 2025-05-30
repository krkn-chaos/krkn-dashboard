import React from "react";
import { SelectBasic } from "@/components/atoms/SelectBox/SelectBox";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { useSelector } from "react-redux";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
const LogsUI = () => {
  const { logs, podDetailsList } = useSelector((state) => state.experiment);
  const fullLog = logs && Array.isArray(logs) ? logs.join("\n") : logs;

  let parsedJson = null;
  let isJson = false;

  try {
    parsedJson = JSON.parse(fullLog);
    console.log(parsedJson);
    isJson = true;
  } catch (e) {
    isJson = false;
  }

  return (
    <div className="logs-wrapper">
      <div className="margin-top">Select to view the logs</div>
      <SelectBasic options={podDetailsList} />
      <div className="logs-container" style={{ padding: "1rem" }}>
        {isJson ? (
          <SyntaxHighlighter language="json" style={vscDarkPlus}>
            {JSON.stringify(parsedJson, null, 2)}
          </SyntaxHighlighter>
        ) : (
          logs &&
          logs.map((log, index) => (
            <div key={index} style={{ whiteSpace: "pre-wrap" }}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogsUI;
