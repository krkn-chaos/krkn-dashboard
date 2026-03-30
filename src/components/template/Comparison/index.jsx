import { Card, CardBody, Grid, GridItem } from "@patternfly/react-core";
import ScenarioHeatMap from "@/components/organisms/ComparisonPageCharts/ScenarioHeatMap";
import React from "react";
import { useSelector } from "react-redux";
import StackedBarChart from "@/components/organisms/ComparisonPageCharts/StackedBarChart";

const ComparisonView = () => {
  const {
    comparisonData,
    scenarioComparisonData,
    cloudTypeComparisonData,
    cloudInfraComparisonData,
  } = useSelector((state) => state.summary);
  return (
    <>
      {Object.keys(comparisonData).length > 0 && (
        <Grid hasGutter>
          <GridItem span={12}>
            <Card>
              <CardBody>
                {Object.keys(scenarioComparisonData).length > 0 && (
                  <ScenarioHeatMap />
                )}
              </CardBody>
            </Card>
          </GridItem>
          <GridItem span={6}>
            <Card>
              <CardBody>
                {Object.keys(cloudInfraComparisonData?.chartData).length >
                  0 && (
                  <StackedBarChart data={cloudInfraComparisonData.chartData} />
                )}
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      )}
    </>
  );
};

export default ComparisonView;
