import React from "react";
import { useSelector } from "react-redux";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import {
  Card,
  CardBody,
  CardTitle,
  Grid,
  GridItem,
} from "@patternfly/react-core";

const theme = {
  fontSize: 14,
  textColor: "#333333",
  axis: {
    domain: {
      line: {
        stroke: "#777777",
        strokeWidth: 1,
      },
    },
    legend: {
      text: {
        fontSize: 14,
        fill: "#333333",
      },
    },
    ticks: {
      line: {
        stroke: "#777777",
        strokeWidth: 1,
      },
      text: {
        fontSize: 12,
        fill: "#333333",
      },
    },
  },
  legends: {
    text: {
      fontSize: 12,
      fill: "#333333",
    },
  },
};

const ScenarioHeatMap = () => {
  const { group_by, scenarioComparisonData } = useSelector(
    (state) => state.summary
  );

  const data = scenarioComparisonData?.data ?? [];
  const keys = scenarioComparisonData?.keys ?? [];

  if (!data.length || !keys.length) {
    return (
      <Grid hasGutter>
        <GridItem span={12}>
          <Card>
            <CardTitle>Scenario Success Rate (%) by {group_by}</CardTitle>
            <CardBody>No comparison data for this grouping.</CardBody>
          </Card>
        </GridItem>
      </Grid>
    );
  }

  return (
    <Grid hasGutter>
      <GridItem span={12}>
        <Card>
          <CardTitle>Scenario Success Rate (%) by {group_by}</CardTitle>
          <CardBody style={{ height: "500px" }}>
            <ResponsiveHeatMap
              data={data}
              keys={keys}
              indexBy="id"
              margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
              colors={{
                type: "sequential",
                colors: ["#E8F5E9", "#A5D6A7", "#66BB6A", "#43A047", "#2E7D32"],
              }}
              axisTop={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: "",
                legendOffset: 46,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
              }}
              theme={theme}
              labelTextColor={{
                from: "color",
                modifiers: [["darker", 2]],
              }}
            />
          </CardBody>
        </Card>
      </GridItem>
    </Grid>
  );
};

export default ScenarioHeatMap;
