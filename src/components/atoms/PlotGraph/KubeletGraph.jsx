import Plot from "react-plotly.js";
import Plotly from "plotly.js/dist/plotly";
import PropTypes from "prop-types";
import React, { useEffect, useRef } from "react";

const KubeletGraph = (props) => {
  const { data } = props;
  const containerRef = useRef(null);
  const graphDivRef = useRef(null);

  // react-plotly's `useResizeHandler` only reflows on the window `resize`
  // event, so the chart goes stale whenever its *container* changes size for
  // any other reason (expandable table rows, grid reflow, sidebar toggles).
  // Observe the container directly and reflow on every size change so the plot
  // stays correctly sized at all viewport widths, not just full screen.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => {
      if (graphDivRef.current) {
        Plotly.Plots.resize(graphDivRef.current);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

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
      automargin: true,
      ticksuffix: " ",
    },
    bargap: 0.2,
    autosize: true,
    height: 400,
    // Keep margins tight; `automargin` on both axes grows them as needed to fit
    // labels. The old fixed r:150 wasted ~half the width on narrow containers.
    margin: { l: 10, r: 30, t: 60, b: 60 },
  };

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <Plot
        data={plotData}
        layout={layout}
        config={{ responsive: true }}
        useResizeHandler
        onInitialized={(figure, graphDiv) => {
          graphDivRef.current = graphDiv;
        }}
        onUpdate={(figure, graphDiv) => {
          graphDivRef.current = graphDiv;
        }}
        style={{ width: "100%", height: "400px" }}
      />
    </div>
  );
};

export default KubeletGraph;

KubeletGraph.propTypes = {
  data: PropTypes.Object,
};
