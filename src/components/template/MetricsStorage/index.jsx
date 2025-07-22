import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  Button,
  Card,
  CardBody,
  Flex,
  FlexItem,
  Text,
  TextContent,
  TextVariants,
} from "@patternfly/react-core";
import { useDispatch, useSelector } from "react-redux";

import ESConnectForm from "@/components/organisms/ESConnectForm";
import React from "react";
import StorageTable from "@/components/organisms/StorageTable";
import { toggleAccordion, disconnectES } from "@/actions/storageActions";

const MetricsStorage = () => {
  const results = useSelector((state) => state.storage.results);
  const isExpanded = useSelector((state) => state.storage.isExpanded);
  const connectionInfo = useSelector((state) => state.storage.connectionInfo);
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
            {connectionInfo.isConnected ? (
              <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                <FlexItem>
                  <TextContent>
                    <Text component={TextVariants.h3}>Storage Metrics</Text>
                    <Text component={TextVariants.small}>
                      Connected to: {connectionInfo.host}
                      {connectionInfo.index && ` | Index: ${connectionInfo.index}`}
                    </Text>
                  </TextContent>
                </FlexItem>
                <FlexItem>
                  <Button
                    variant="link"
                    isSmall
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(disconnectES());
                    }}
                  >
                    Disconnect
                  </Button>
                </FlexItem>
              </Flex>
            ) : (
              "Storage Metrics"
            )}
          </AccordionToggle>
          <AccordionContent isHidden={!isExpanded}>
            {!connectionInfo.isConnected && (
            <Card>
              <CardBody>
                <ESConnectForm />
              </CardBody>
            </Card>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {results.length > 0 && <StorageTable />}
    </>
  );
};

export default MetricsStorage;
