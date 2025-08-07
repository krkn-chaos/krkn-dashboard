import Plot from "react-plotly.js";
import PropTypes from "prop-types";
import React from "react";

const KubeletGraph = (props) => {
  const { data } = props;
  // Sort data to display the highest value at the top
  const sortedData = Object.entries(data).sort(([, a], [, b]) => b - a);
  const labels = sortedData.map(([key]) => key);
  const values = sortedData.map(([, value]) => value);

  const plotData = [
    {
      y: labels,
      x: values,
      type: "bar",
      orientation: "h",
      marker: {
        color: "rgba(179, 229, 252, 0.8)",
        line: {
          color: "rgba(3, 155, 229, 1)",
          width: 1,
        },
      },
    },
  ];

  const layout = {
    title: {
      text: "Kubernetes Object Count",
      font: { size: 18, family: "Arial, sans-serif" },
      x: 0.5,
      xanchor: "center",
    },
    xaxis: {
      title: { text: "Count", font: { size: 14 } },
      tickangle: 0,
      automargin: true,
    },
    yaxis: {
      autorange: "reversed",
    },
    bargap: 0.2,
    height: 400,
    width: 500,
    margin: { l: 60, r: 150, t: 80, b: 80 },
  };

  return <Plot data={plotData} layout={layout} config={{ responsive: true }} />;
};

export default KubeletGraph;

KubeletGraph.propTypes = {
  data: PropTypes.Object,
};
