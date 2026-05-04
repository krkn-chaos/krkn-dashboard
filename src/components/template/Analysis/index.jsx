import {
  Tabs,
  Tab,
  TabTitleText,
  Card,
  CardBody,
  Grid,
  GridItem,
  Flex,
  FlexItem,
  Text,
  TextContent,
  TextVariants,
  Button,
} from "@patternfly/react-core";
import React, { useState } from "react";
import Summary from "../Summary/index";
import AlertAnalysis from "../AlertAnalysis/index";
import ComparisonView from "../Comparison/index";
import { useSelector, useDispatch } from "react-redux";
import StorageTableFilter from "@/components/molecules/StorageTableFilter";
import MetricCard from "@/components/molecules/MetricsCard";

import ESConnectForm from "@/components/organisms/ESConnectForm";
import { disconnectES } from "@/actions/storageActions";

const Analysis = () => {
  const { group_by, start_date, end_date, aggregations } = useSelector(
    (state) => state.summary
  );
  const dispatch = useDispatch();
  const connectionInfo = useSelector((state) => state.storage.connectionInfo);
  const [activeTabKey, setActiveTabKey] = useState(0);

  const titleMap = {
    total_runs: "Total jobs",
    success: "Success",
    failure: "Failure",
    pass_rate: "Success Rate",
  };

  const handleTabClick = (_event, tabIndex) => {
    setActiveTabKey(tabIndex);
  };

  return (
    <>
      <Card>
        <CardBody>
          {connectionInfo.isConnected ? (
            <Flex justifyContent={{ default: "justifyContentSpaceBetween" }}>
              <FlexItem>
                <TextContent>
                  <Text component={TextVariants.small}>
                    Connected to: {connectionInfo.host}
                    {connectionInfo.index &&
                      ` | Index: ${connectionInfo.index}`}
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
            <Card>
              <CardBody>
                <ESConnectForm />
              </CardBody>
            </Card>
          )}
        </CardBody>
      </Card>
      <Tabs
        activeKey={activeTabKey}
        aria-label="Analysis Tabs"
        onSelect={handleTabClick}
      >
        <Tab eventKey={0} title={<TabTitleText>Summary</TabTitleText>}>
          {aggregations?.summary && (
            <Card>
              <CardBody>
                <StorageTableFilter
                  start_date={start_date}
                  end_date={end_date}
                  type="summary"
                />
                <Grid hasGutter>
                  {Object.entries(aggregations.summary).map(([key, value]) => (
                    <GridItem key={key} span={3}>
                      <MetricCard
                        key={key}
                        title={titleMap[key] ?? key}
                        footer={value}
                      />
                    </GridItem>
                  ))}
                </Grid>
              </CardBody>
            </Card>
          )}
          {group_by === "Status" ? <Summary /> : <ComparisonView />}
        </Tab>
        <Tab eventKey={1} title={<TabTitleText>Alert Analysis</TabTitleText>}>
          <AlertAnalysis />
        </Tab>
      </Tabs>
    </>
  );
};

export default Analysis;
