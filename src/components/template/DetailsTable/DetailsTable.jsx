import "./index.less";

import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { Label } from "@patternfly/react-core";
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
      {podDetails &&
        Object.keys(podDetails).length > 0 &&
        podDetails.constructor === Object && (
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
                <Tr>
                  <Td>{podDetails.Id?.toString()?.substr(0, 8)}</Td>
                  <Td>{podDetails.Image}</Td>
                  <Td>{podDetails.CreatedAt}</Td>
                  <Td>{podDetails.Names}</Td>
                  <Td>{podDetails.Mounts}</Td>
                  <Td className="state-class">
                    {podDetails.State === "running" ? (
                      <Label
                        className="run-class"
                        variant="outline"
                        color={"blue"}
                        icon={<SyncAltIcon />}
                      >
                        RUNNING
                      </Label>
                    ) : (
                      podDetails.State
                    )}
                  </Td>
                  <Td>
                    {podDetails.State === "running" ? (
                      <div className="flash-box">
                        <div className="dot-flashing"></div>
                      </div>
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
