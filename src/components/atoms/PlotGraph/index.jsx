import Plot from "react-plotly.js";
import PropTypes from "prop-types";
import React from "react";

const PlotGraph = (props) => {
  const { items, title = "Pod Recovery Breakdown", height = "400px" } = props;

  const podData = Array.isArray(items) ? items : [items];

  // Filter out invalid pods and ensure we have data
  const validPods = podData.filter(
    (pod) =>
      pod &&
      pod.pod_name &&
      (pod.pod_rescheduling_time !== undefined ||
        pod.pod_readiness_time !== undefined ||
        pod.total_recovery_time !== undefined)
  );

  if (validPods.length === 0) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
          margin: "10px 0",
        }}
      >
        No pod recovery data available for visualization
      </div>
    );
  }

  // Extract data for plotting
  const podNames = validPods.map((pod) => pod.pod_name || "Unknown");
  const reschedulingTimes = validPods.map(
    (pod) => pod.pod_rescheduling_time || 0
  );
  const readinessTimes = validPods.map((pod) => pod.pod_readiness_time || 0);
  const totalRecoveryTimes = validPods.map(
    (pod) => pod.total_recovery_time || 0
  );
  const expectedRecoveryTimes = validPods.map(
    (pod) => pod.krkn_pod_recovery_time || 0
  );

  return (
    <div style={{ margin: "20px 0" }}>
      <Plot
        data={[
          {
            type: "bar",
            name: "Pod Rescheduling Time",
            x: podNames,
            y: reschedulingTimes,
            marker: {
              color: "rgba(135, 206, 235, 0.8)",
              line: { color: "rgba(135, 206, 235, 1)", width: 1 },
            },
            hovertemplate:
              "<b>%{x}</b><br>" +
              "Rescheduling Time: %{y:.2f}s<br>" +
              "<extra></extra>",
          },
          {
            type: "bar",
            name: "Pod Readiness Time",
            x: podNames,
            y: readinessTimes,
            marker: {
              color: "rgba(255, 165, 0, 0.8)",
              line: { color: "rgba(255, 165, 0, 1)", width: 1 },
            },
            hovertemplate:
              "<b>%{x}</b><br>" +
              "Readiness Time: %{y:.2f}s<br>" +
              "<extra></extra>",
          },
          {
            type: "scatter",
            mode: "lines+markers",
            name: "Total Recovery Time",
            x: podNames,
            y: totalRecoveryTimes,
            line: {
              color: "rgba(220, 20, 60, 1)",
              width: 3,
              dash: "dash",
            },
            marker: {
              color: "rgba(220, 20, 60, 1)",
              size: 8,
              symbol: "diamond",
            },
            hovertemplate:
              "<b>%{x}</b><br>" +
              "Total Recovery Time: %{y:.2f}s<br>" +
              "<extra></extra>",
          },
          {
            type: "scatter",
            mode: "lines+markers",
            name: "Expected Recovery Time",
            x: podNames,
            y: expectedRecoveryTimes,
            line: {
              color: "rgba(34, 139, 34, 1)",
              width: 3,
              dash: "dot",
            },
            marker: {
              color: "rgba(34, 139, 34, 1)",
              size: 8,
              symbol: "circle",
            },
            hovertemplate:
              "<b>%{x}</b><br>" +
              "Expected Recovery Time: %{y:.2f}s<br>" +
              "<extra></extra>",
          },
        ]}
        layout={{
          title: {
            text: title,
            font: { size: 18, family: "Arial, sans-serif" },
            x: 0.5,
            xanchor: "center",
          },
          barmode: "group",
          xaxis: {
            title: { text: "Pod Name", font: { size: 14 } },
            tickangle: 0,
            automargin: true,
          },
          yaxis: {
            title: { text: "Time (seconds)", font: { size: 14 } },
            zeroline: true,
            zerolinecolor: "rgba(0,0,0,0.2)",
            zerolinewidth: 1,
          },
          legend: {
            title: { text: "Recovery Metrics" },
            orientation: "v",
            yanchor: "top",
            y: 1,
            xanchor: "left",
            x: 1.02,
          },
          hovermode: "x unified",
          margin: { l: 60, r: 150, t: 80, b: 80 },
          plot_bgcolor: "rgba(0,0,0,0)",
          paper_bgcolor: "rgba(0,0,0,0)",
          font: { family: "Arial, sans-serif", size: 12 },
        }}
        style={{ width: "100%", height: height }}
        config={{
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ["pan2d", "lasso2d", "select2d"],
        }}
      />

      {/* Summary statistics */}
      {validPods.length > 1 && (
        <div
          style={{
            marginTop: "10px",
            padding: "10px",
            backgroundColor: "#f8f9fa",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          <strong>Summary:</strong> {validPods.length} recovered pods • Avg
          Total Recovery:{" "}
          {(
            totalRecoveryTimes.reduce((a, b) => a + b, 0) / validPods.length
          ).toFixed(2)}
          s • Avg Expected Recovery:{" "}
          {(
            expectedRecoveryTimes.reduce((a, b) => a + b, 0) / validPods.length
          ).toFixed(2)}
          s • Max Recovery: {Math.max(...totalRecoveryTimes).toFixed(2)}s •
          Recovery vs Expected:{" "}
          {totalRecoveryTimes.length > 0 && expectedRecoveryTimes.length > 0
            ? (
                (totalRecoveryTimes.reduce((a, b) => a + b, 0) /
                  expectedRecoveryTimes.reduce((a, b) => a + b, 0)) *
                100
              ).toFixed(1) + "% of expected"
            : "N/A"}
        </div>
      )}
    </div>
  );
};

export default PlotGraph;

PlotGraph.propTypes = {
  items: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.arrayOf(PropTypes.object),
  ]).isRequired,
  title: PropTypes.string,
  height: PropTypes.string,
};
