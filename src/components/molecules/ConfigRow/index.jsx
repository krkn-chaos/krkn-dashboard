import { Card, CardBody, Title } from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import PropTypes from "prop-types";
import React from "react";

const ConfigRow = (props) => {
  const { doc } = props;
  const columnNames = {
    key: "Metadata",
    value: "Value",
  };

  const renderConfigValue = (key, value) => {
    if (key === "parameters" && typeof value === "object" && value !== null) {
      return Object.keys(value).map((paramKey) => (
        <Tr key={`${doc.config.id}-${paramKey}`}>
          <Td>{paramKey === "krkn_pod_recovery_time"?"Expected Recovery Time":paramKey}</Td>
          <Td>{JSON.stringify(value[paramKey])}</Td>
        </Tr>
      ));
    } else {
      return (
        <Tr key={`${doc.config.id}-${key}`}>
          <Td>{key}</Td>
          <Td>
            {value !== null && value !== undefined
              ? JSON.stringify(value)
              : "N/A"}
          </Td>
        </Tr>
      );
    }
  };

  return (
    <Card>
      <CardBody>
        <Title headingLevel="h4" className="type_heading">
          Cluster Config
        </Title>
        <Table
          className="box"
          aria-label="metadata-table"
          ouiaId="metadata-table"
          isCompact
        >
          <Thead>
            <Tr>
              <Th width={10} style={{ textAlign: "left" }}>
                {columnNames.key}
              </Th>
              <Th width={10}>{columnNames.value}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {Object.keys(doc.config)
              .filter((key) => key !== "id")
              .map((key) => renderConfigValue(key, doc.config[key]))}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );
};

export default ConfigRow;
ConfigRow.propTypes = {
  doc: PropTypes.object,
};
