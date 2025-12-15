import {
  Tabs,
  Tab,
  TabContent,
  TabTitleText,
  Card,
  CardBody,
  Grid,
  GridItem,
} from "@patternfly/react-core";
import React from "react";
import Summary from "../Summary/index";
import AlertAnalysis from "../AlertAnalysis/index";
import ComparisonView from "../Comparison/index";
import { useSelector } from "react-redux";
import StorageTableFilter from "@/components/molecules/StorageTableFilter";
import MetricCard from "@/components/molecules/MetricsCard";

const Analysis = () => {
  const { group_by, start_date, end_date, aggregations } = useSelector(
    (state) => state.summary
  );

  const titleMap = {
    total_runs: "Total jobs",
    success: "Success",
    failure: "Failure",
    pass_rate: "Success Rate",
  };

  return (
    <Tabs defaultActiveKey={0} aria-label="Analysis Tabs">
      <Tab eventKey={0} title={<TabTitleText>Summary</TabTitleText>}>
        <TabContent>
          {aggregations?.summary && (
            <Card>
              <CardBody>
                <StorageTableFilter
                  start_date={start_date}
                  end_date={end_date}
                  type={"summary"}
                />
                <Grid hasGutter>
                  {Object.entries(aggregations.summary).map(([key, value]) => {
                    return (
                      <GridItem key={key} span={3}>
                        <MetricCard
                          key={key}
                          title={titleMap[key]}
                          footer={value}
                        />
                      </GridItem>
                    );
                  })}
                </Grid>
              </CardBody>
            </Card>
          )}
          {group_by === "Status" ? <Summary /> : <ComparisonView />}
        </TabContent>
      </Tab>
      <Tab eventKey={1} title={<TabTitleText>Alert Analysis</TabTitleText>}>
        <TabContent>
          <AlertAnalysis />
        </TabContent>
      </Tab>
    </Tabs>
  );
};

export default Analysis;
