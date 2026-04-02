import "./index.less";

import {
  ExpandableRowContent,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";
import { Grid, GridItem } from "@patternfly/react-core";
import React, { useCallback, useState } from "react";

import ConfigRow from "@/components/molecules/ConfigRow";
import GraphRow from "@/components/molecules/GraphRow";
import GrafanaLink from "@/components/atoms/GrafanaLink";
import RenderPagination from "../RenderPagination";
import StatusCell from "@/components/atoms/StatusCell";
import StorageTableFilter from "@/components/molecules/StorageTableFilter";
import { formatDateTime } from "@/utils/helper";
import { useSelector } from "react-redux";
import { resolveDashboardPath } from "@/assets/constants/grafanaConstants";

const StorageTable = () => {
  const results = useSelector((state) => state.storage.results);
  const { start_date, end_date, size, pagination, connectionInfo } = useSelector(
    (state) => state.storage
  );
  const [expandedRunNames, setExpandedRunNames] = useState([]);
  const setRunExpanded = (run, isExpanding = true) => {
    setExpandedRunNames((prevExpanded) => {
      const otherExpandedRunNames = prevExpanded.filter((r) => r !== run.id);
      return isExpanding
        ? [...otherExpandedRunNames, run.id]
        : otherExpandedRunNames;
    });
  };

  const isRunExpanded = useCallback(
    (run) => expandedRunNames.includes(run.id),
    [expandedRunNames]
  );
  const columnNames = {
    scenario_type: "Scenario Type",
    start_time: "Start Time",
    end_time: "End Time",
    namespace: "Namespace",
    status: "Status",
  };

  return (
    <>
      <StorageTableFilter start_date={start_date} end_date={end_date} />
      <Table isStriped aria-label="Storage Data Table">
        <Thead>
          <Tr>
            <Th screenReaderText="Row expansion" />
            {columnNames &&
              Object.keys(columnNames).map((column) => (
                <Th key={column}>{columnNames[column]}</Th>
              ))}
          </Tr>
        </Thead>

        {results?.length > 0 &&
          results.map((doc, idx) => {
            return (
              <Tbody key={doc.id} isExpanded={isRunExpanded(doc)}>
                <Tr key={doc.id}>
                  <Td
                    expand={
                      doc.config
                        ? {
                            rowIndex: idx,
                            isExpanded: isRunExpanded(doc),
                            onToggle: () =>
                              setRunExpanded(doc, !isRunExpanded(doc)),
                            expandId: `expandable-row-${doc.id}`,
                          }
                        : undefined
                    }
                  />
                  <Td>{doc.scenario_type}</Td>
                  <Td>{formatDateTime(doc.start_time)}</Td>
                  <Td>{formatDateTime(doc.end_time)}</Td>
                  <Td>{doc.config?.parameters?.namespace_pattern}</Td>
                  <Td>
                    <StatusCell exit_status={doc.status} />
                  </Td>
                </Tr>
                {doc.config && isRunExpanded(doc) ? (
                  <Tr isExpanded={isRunExpanded(doc)}>
                    <Td colSpan={8}>
                      <ExpandableRowContent>
                        <Grid hasGutter className="metrics-expanded-row">
                          <GridItem span={6}>
                            <ConfigRow doc={doc} />
                          </GridItem>
                          <GridItem span={6}>
                            <GraphRow doc={doc} />
                          </GridItem>
                        </Grid>
                        {connectionInfo?.grafanaBaseUrl ? (() => {
                          const dashboardPath = resolveDashboardPath(
                            doc.scenario_type,
                            connectionInfo.grafanaDashboardIndex
                          );
                          return (
                            <Grid hasGutter className="pf-v5-u-mt-md">
                              <GridItem span={12}>
                                <div className="pf-v5-u-display-flex pf-v5-u-justify-content-flex-end pf-v5-u-align-items-center pf-v5-u-gap-md pf-v5-u-flex-wrap">
                                  {dashboardPath ? (
                                    <>
                                      <span>View metrics on Grafana:</span>
                                      <GrafanaLink
                                        config={doc.config || {}}
                                        uuid={doc.uuid}
                                        grafanaBaseUrl={connectionInfo.grafanaBaseUrl}
                                        dashboardPath={dashboardPath}
                                      />
                                    </>
                                  ) : (
                                    <span className="pf-v5-u-font-size-sm">
                                      No grafana dashboard matched scenario type
                                    </span>
                                  )}
                                </div>
                              </GridItem>
                            </Grid>
                          );
                        })() : null}
                      </ExpandableRowContent>
                    </Td>
                  </Tr>
                ) : null}
              </Tbody>
            );
          })}
      </Table>
      <RenderPagination
        items={pagination.total}
        page={pagination.currentPage}
        perPage={size}
      />
    </>
  );
};

export default StorageTable;
