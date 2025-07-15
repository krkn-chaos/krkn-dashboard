import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@patternfly/react-icons";

import { Label } from "@patternfly/react-core";
import PropTypes from "prop-types";
import React from "react";

const StatusCell = (props) => {
  const { exit_status } = props;
  return exit_status === true ? (
    <Label
      color="green"
      icon={<CheckCircleIcon data-ouia-component-id="check_circle_icon" />}
    >
      Pass
    </Label>
  ) : (
    <Label
      color="red"
      icon={
        <ExclamationCircleIcon data-ouia-component-id="exclamation_circle_icon" />
      }
    >
      Fail
    </Label>
  );
};

export default StatusCell;
StatusCell.propTypes = {
  exit_status: PropTypes.number || PropTypes.bool,
};
