import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  Card,
  CardBody,
} from "@patternfly/react-core";
import { useDispatch, useSelector } from "react-redux";

import ESConnectForm from "@/components/organisms/ESConnectForm";
import React from "react";
import StorageTable from "@/components/organisms/StorageTable";
import { toggleAccordion } from "@/actions/storageActions";

const MetricsStorage = () => {
  const results = useSelector((state) => state.storage.results);
  const isExpanded = useSelector((state) => state.storage.isExpanded);
  const dispatch = useDispatch();
  return (
    <>
      <Accordion asDefinitionList>
        <AccordionItem>
          <AccordionToggle
            onClick={() => {
              dispatch(toggleAccordion(!isExpanded));
            }}
            isExpanded={isExpanded}
            id="es-instance"
          >
            Storage Metrics
          </AccordionToggle>
          <AccordionContent isHidden={!isExpanded}>
            <Card>
              <CardBody>
                <ESConnectForm />
              </CardBody>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {results.length > 0 && <StorageTable />}
    </>
  );
};

export default MetricsStorage;
