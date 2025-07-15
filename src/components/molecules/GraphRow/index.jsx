import { Card, CardBody } from "@patternfly/react-core";

import PlotGraph from "@/components/atoms/PlotGraph";
import PropTypes from "prop-types";
import React from "react";

const GraphRow = (props) => {
    const { affected_pods } = props.doc;
    
    console.log('All affected_pods:', affected_pods);
    const recoveredPods = affected_pods.filter((pod) => pod.status === "recovered");
    console.log('Recovered pods:', recoveredPods);

    return (
        <Card>
            <CardBody>
                {recoveredPods.length > 0 ? (
                    recoveredPods.map((pod, idx) => (
                        <PlotGraph key={idx} item={pod} />
                    ))
                ) : (
                    <div>No recovered pods to display</div>
                )}
            </CardBody>
        </Card>
    );
};

export default GraphRow;
GraphRow.propTypes = {
  doc: PropTypes.object,
};
