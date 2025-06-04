import {
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Grid,
  GridItem,
} from "@patternfly/react-core";
import React, { useEffect, useState } from "react";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { useSelector } from "react-redux";

// Utility to flatten nested objects with dot notation
const flatten = (obj, parentKey = "", result = {}) => {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      flatten(value, fullKey, result);
    } else {
      result[fullKey] = value;
    }
  }
  return result;
};

const StorageTable = () => {
  const results = useSelector((state) => state.storage.results);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [flattenedData, setFlattenedData] = useState([]);
  const [allColumns, setAllColumns] = useState([]);

  // Process results on load or when they change
  useEffect(() => {
    if (!results?.length) return;

    const flattened = results.map((hit) => flatten(hit._source));
    const keys = new Set();

    flattened.forEach((doc) =>
      Object.keys(doc).forEach((key) => keys.add(key))
    );

    const columnList = Array.from(keys);
    setAllColumns(columnList);
    setFlattenedData(flattened);
  }, [results]);

  const toggleColumn = (col) => {
    setSelectedColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  return (
    <>
      <Card>
        <CardHeader>Select the columns</CardHeader>
        <CardBody>
          <Grid hasGutter>
            {allColumns.map((col) => (
              <GridItem key={col} span={2}>
                <Checkbox
                  id={col}
                  label={col}
                  isChecked={selectedColumns.includes(col)}
                  onChange={() => toggleColumn(col)}
                />
              </GridItem>
            ))}
          </Grid>
        </CardBody>
      </Card>

      {selectedColumns.length > 0 && (
        <Table isStriped aria-label="Storage Data Table">
          <Thead>
            <Tr>
              {selectedColumns.map((column) => (
                <Th key={column}>{column}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {flattenedData.map((doc, idx) => (
              <Tr key={idx}>
                {selectedColumns.map((col) => (
                  <Td key={col}>
                    {typeof doc[col] === "object" && doc[col] !== null
                      ? JSON.stringify(doc[col])
                      : String(doc[col] ?? "")}
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </>
  );
};

export default StorageTable;
