import "./index.less";

import {
  Button,
  Card,
  CardBody,
  CardTitle,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  Tab,
  Tabs,
  TabTitleText,
  Text,
  TextContent,
  TextVariants,
  Title,
} from "@patternfly/react-core";
import React, { useState } from "react";

import AlertAnalysis from "../AlertAnalysis/index";
import ComparisonView from "../Comparison/index";
import MetricCard from "@/components/molecules/MetricsCard";
import Summary from "../Summary/index";
import { useDispatch, useSelector } from "react-redux";

import ESConnectForm from "@/components/organisms/ESConnectForm";
import StorageTable from "@/components/organisms/StorageTable";
import StorageTableFilter from "@/components/molecules/StorageTableFilter";
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

  if (!connectionInfo.isConnected) {
    return (
      <Card>
        <CardBody>
          <Title
            headingLevel="h1"
            size="3xl"
            className="analysis__page-title"
          >
            Connect to Elastic Search
          </Title>
          <ESConnectForm />
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardBody>
          <Flex justifyContent={{ default: "justifyContentSpaceBetween" }}>
            <FlexItem>
              <TextContent>
                <Text component={TextVariants.h3}>Elastic Search</Text>
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
        </CardBody>
      </Card>
      <Tabs
        activeKey={activeTabKey}
        aria-label="Elastic runs tabs"
        onSelect={handleTabClick}
      >
        <Tab eventKey={0} title={<TabTitleText>Summary and Runs</TabTitleText>}>
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
          <div className="elastic-runs__runs-section">
            <Card>
            <CardTitle>Runs</CardTitle>
            <CardBody>
              <StorageTable />
            </CardBody>
            </Card>
          </div>
        </Tab>
        <Tab eventKey={1} title={<TabTitleText>Alert Analysis</TabTitleText>}>
          <AlertAnalysis />
        </Tab>
      </Tabs>
    </>
  );
};

export default Analysis;
