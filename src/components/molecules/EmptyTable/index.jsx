import {
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
} from "@patternfly/react-core";

import PropTyes from "prop-types";
import React from "react";
import { SearchIcon } from "@patternfly/react-icons";

const EmptyStateTable = (props) => (
  <EmptyState>
    <EmptyStateHeader
      icon={<EmptyStateIcon icon={SearchIcon} />}
      titleText="No results found"
      headingLevel="h2"
    />
    <EmptyStateBody>{props.message}</EmptyStateBody>
  </EmptyState>
);

EmptyStateTable.propTypes = {
  message: PropTyes.string,
};
export default EmptyStateTable;
