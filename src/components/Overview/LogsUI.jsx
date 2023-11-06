import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  Card,
  CardBody,
} from "@patternfly/react-core";
import React, { useState } from "react";

import { useSelector } from "react-redux";

const LogsUI = () => {
  const { logs, errorLogs } = useSelector((state) => state.experiment);
  const [expanded, setExpanded] = useState(["ex2-toggle1"]);
  const toggle = (id) => {
    const index = expanded.indexOf(id);
    const newExpanded =
      index >= 0
        ? [
            ...expanded.slice(0, index),
            ...expanded.slice(index + 1, expanded.length),
          ]
        : [...expanded, id];
    setExpanded(newExpanded);
  };
  return (
    <Card>
      <CardBody>
        <Accordion asDefinitionList={false}>
          {logs && (
            <AccordionItem>
              <AccordionToggle
                onClick={() => toggle("ex2-toggle1")}
                isExpanded={expanded.includes("ex2-toggle1")}
                id="ex2-toggle1"
              >
                Logs
              </AccordionToggle>
              <AccordionContent
                id="ex2-expand1"
                isHidden={!expanded.includes("ex2-toggle1")}
              >
                <div dangerouslySetInnerHTML={{ __html: logs }}></div>
              </AccordionContent>
            </AccordionItem>
          )}

          {errorLogs && (
            <AccordionItem>
              <AccordionToggle
                onClick={() => toggle("ex2-toggle2")}
                isExpanded={expanded.includes("ex2-toggle2")}
                id="ex2-toggle2"
              >
                Others
              </AccordionToggle>
              <AccordionContent
                id="ex2-expand2"
                isHidden={!expanded.includes("ex2-toggle2")}
              >
                <div dangerouslySetInnerHTML={{ __html: errorLogs }}></div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardBody>
    </Card>
  );
};

export default LogsUI;
