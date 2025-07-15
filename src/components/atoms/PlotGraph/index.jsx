import Plot from "react-plotly.js";
import PropTypes from "prop-types";
import React from "react";
const PlotGraph = (props) => {
  const { item } = props;
  console.log('PlotGraph item:', item);
  if (!item || !item.pod_name) {
    return <div>No pod data available for chart</div>;
  }

  return (
    <Plot
      data={[
        {
          type: "bar",
          name: "Rescheduling Time",
          x: [item.pod_name], // Wrap in array
          y: [item.pod_rescheduling_time || 0], // Wrap in array with fallback
          marker: { color: "skyblue" },
        },
        {
          type: "bar",
          name: "Readiness Time",
          x: [item.pod_name], // Wrap in array
          y: [item.pod_readiness_time || 0], // Wrap in array with fallback
          marker: { color: "orange" },
        },
        {
          type: "scatter",
          mode: "lines+markers",
          name: "Total Recovery Time",
          x: [item.pod_name], // Wrap in array
          y: [item.total_recovery_time || 0], // Wrap in array with fallback
          line: { color: "black", dash: "dash" },
        },
      ]}
      layout={{
        title: `Pod Recovery Breakdown - ${item.pod_name}`,
        barmode: "stack",
        xaxis: { title: "Pod Name" },
        yaxis: { title: "Time (seconds)" },
        legend: { title: { text: "Recovery Components" } },
        hovermode: "x unified",
      }}
      style={{ width: "100%", height: "400px" }}
      config={{ responsive: true }}
    />
  );
};

export default PlotGraph;

PlotGraph.propTypes = {
  item: PropTypes.object,
};
