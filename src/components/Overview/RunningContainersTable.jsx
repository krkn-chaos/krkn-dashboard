import "@/components/template/DetailsTable/index.less";

import { Label, Title } from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { SyncAltIcon } from "@patternfly/react-icons";

import PODStatus from "./PODStatus";
import React from "react";

const columnNames = {
  containerID: "Container ID",
  image: "Image",
  created: "Created",
  name: "Name",
  mount: "Mounts",
  state: "State",
  status: "Status",
};

function formatCell(value) {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

const RunningContainersTable = ({ pods }) => {
  if (!pods?.length) {
    return null;
  }

  return (
    <div className="overview-running-containers">
      <Title
        headingLevel="h3"
        className="overview-running-title pf-v5-u-mb-md"
      >
        Running Kraken containers
      </Title>
      <div className="details-card-body">
        <Table>
          <Thead>
            <Tr>
              <Th width={10}>{columnNames.containerID}</Th>
              <Th width={30}>{columnNames.image}</Th>
              <Th width={20}>{columnNames.created}</Th>
              <Th width={5}>{columnNames.name}</Th>
              <Th width={15}>{columnNames.mount}</Th>
              <Th width={10}>{columnNames.state}</Th>
              <Th width={10}>{columnNames.status}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {pods.map((pod) => (
              <Tr key={pod?.Id?.toString()?.substring(0, 8)}>
                <Td>{pod?.Id?.toString()?.substring(0, 8)}</Td>
                <Td>{formatCell(pod?.Image)}</Td>
                <Td>{formatCell(pod?.CreatedAt ?? pod?.Created)}</Td>
                <Td>{formatCell(pod?.Names)}</Td>
                <Td>{formatCell(pod?.Mounts)}</Td>
                <Td className="state-class">
                  {pod?.State === "running" ? (
                    <Label
                      className="run-class"
                      variant="outline"
                      color="blue"
                      icon={<SyncAltIcon />}
                    >
                      RUNNING
                    </Label>
                  ) : (
                    pod?.State
                  )}
                </Td>
                <Td>
                  {pod?.State === "running" ? (
                    <div className="flash-box">
                      <div className="dot-flashing" />
                    </div>
                  ) : (
                    <PODStatus pod_status={pod?.ExitCode} />
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>
    </div>
  );
};

export default RunningContainersTable;
