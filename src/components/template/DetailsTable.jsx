import "./index.less";

import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import PODStatus from "@/components/Overview/PODStatus";
import React from "react";
import { SyncAltIcon } from "@patternfly/react-icons";
import { useSelector } from "react-redux";

const DetailsTable = () => {
  const { podDetails } = useSelector((state) => state.experiment);

  const columnNames = {
    containerID: "Container ID",
    image: "Image",
    created: "Created",
    name: "Name",
    mount: "Mounts",
    state: "State",
    status: "Status",
  };
  return (
    <>
      {podDetails && (
        <div className="details-card-body">
          <Table>
            <Thead>
              <Tr>
                <Th width={10}>{columnNames.containerID}</Th>
                <Th width={20}>{columnNames.image}</Th>
                <Th width={10}>{columnNames.created}</Th>
                <Th width={10}>{columnNames.name}</Th>
                <Th width={10}>{columnNames.mount}</Th>
                <Th width={10}>{columnNames.state}</Th>
                <Th width={10}>{columnNames.status}</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr>
                <Td>{podDetails.Id?.toString()?.substr(0, 8)}</Td>
                <Td>{podDetails.Image}</Td>
                <Td>{podDetails.CreatedAt}</Td>
                <Td>{podDetails.Names[0]}</Td>
                <Td>{podDetails.Mounts[0]}</Td>
                <Td className="state-class">
                  {podDetails.State === "running" ? (
                    <span className="run-class">
                      <SyncAltIcon /> Running
                    </span>
                  ) : (
                    podDetails.State
                  )}
                </Td>
                <Td>
                  {podDetails.State === "running" ? (
                    <div className="dot-flashing"></div>
                  ) : (
                    <PODStatus pod_status={podDetails.ExitCode} />
                  )}
                </Td>
              </Tr>
            </Tbody>
          </Table>
        </div>
      )}
    </>
  );
};

export default DetailsTable;
