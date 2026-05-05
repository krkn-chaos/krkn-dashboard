import { Card, CardBody, Grid, GridItem } from "@patternfly/react-core";
import ScenarioHeatMap from "@/components/organisms/ComparisonPageCharts/ScenarioHeatMap";
import React from "react";
import { useSelector } from "react-redux";
import StackedBarChart from "@/components/organisms/ComparisonPageCharts/StackedBarChart";

const ComparisonView = () => {
  const {
    comparisonData,
    scenarioComparisonData,
    cloudInfraComparisonData,
  } = useSelector((state) => state.summary);

  const chartRows = cloudInfraComparisonData?.chartData ?? [];
  const hasHeatmap =
    scenarioComparisonData &&
    typeof scenarioComparisonData === "object" &&
    Object.keys(scenarioComparisonData).length > 0 &&
    (scenarioComparisonData.data?.length ?? 0) > 0;

  const hasBarData = Array.isArray(chartRows) && chartRows.length > 0;

  return (
    <>
      {comparisonData && Object.keys(comparisonData).length > 0 && (
        <Grid hasGutter>
          <GridItem span={12}>
            <Card>
              <CardBody>
                {hasHeatmap && <ScenarioHeatMap />}
              </CardBody>
            </Card>
          </GridItem>
          <GridItem span={6}>
            <Card>
              <CardBody>
                {hasBarData && <StackedBarChart data={chartRows} />}
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      )}
    </>
  );
};

export default ComparisonView;
