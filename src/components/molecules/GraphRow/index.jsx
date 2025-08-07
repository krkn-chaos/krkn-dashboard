import { Card, CardBody } from "@patternfly/react-core";

import KubeletGraph from "@/components/atoms/PlotGraph/KubeletGraph";
import PlotGraph from "@/components/atoms/PlotGraph";
import PropTypes from "prop-types";
import React from "react";

const GraphRow = (props) => {
  const { affected_pods, kubernetes_objects_count } = props.doc;
  const recoveredPods = affected_pods.filter(
    (pod) => pod.status === "recovered"
  );
  return (
    <Card>
      <CardBody>
        {recoveredPods.length > 0 ? (
          <PlotGraph
            items={recoveredPods}
            title="Pod Recovery Analysis"
            height="450px"
          />
        ) : (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "#666",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              border: "2px dashed #dee2e6",
            }}
          >
            <h4>No Recovery Data Available</h4>
            <p>No pods with recovery metrics found in this experiment run.</p>
          </div>
        )}
      </CardBody>

      {Object.keys(kubernetes_objects_count).length > 0 && (
        <CardBody>
          <KubeletGraph data={kubernetes_objects_count} />
        </CardBody>
      )}
    </Card>
  );
};

export default GraphRow;
GraphRow.propTypes = {
  doc: PropTypes.object,
};
