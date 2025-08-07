import "./index.less";

import { Card, CardBody, List, ListItem } from "@patternfly/react-core";

import PropTypes from "prop-types";
import React from "react";

const NodeCard = (props) => {
  return (
    <Card className="node-card-container">
      <CardBody>
        <List isPlain>
          {Object.entries(props.summary).map(([key, value]) => (
            <ListItem key={`${key}-${value}`}>
              <span className="key_heading">{key}: </span>
              <span>{value}</span>
            </ListItem>
          ))}
        </List>
      </CardBody>
    </Card>
  );
};
NodeCard.propTypes = {
  summary: PropTypes.object,
};
export default NodeCard;
