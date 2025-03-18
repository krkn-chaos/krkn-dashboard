import "./index.less";

import { Bullseye, Label } from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import EmptyStateTable from "@/components/molecules/EmptyTable";
import PODStatus from "@/components/Overview/PODStatus";
import React from "react";
import { SyncAltIcon } from "@patternfly/react-icons";
import { useSelector } from "react-redux";

const DetailsTable = () => {
  const { podDetailsList } = useSelector((state) => state.experiment);

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
            {podDetailsList?.length > 0 ? (
              podDetailsList.map((podDetails) => (
                <Tr key={podDetails?.Id?.toString()?.substr(0, 8)}>
                  <Td>{podDetails?.Id?.toString()?.substr(0, 8)}</Td>
                  <Td>{podDetails?.Image}</Td>
                  <Td>{podDetails?.CreatedAt}</Td>
                  <Td>{podDetails?.Names}</Td>
                  <Td>{podDetails?.Mounts}</Td>
                  <Td className="state-class">
                    {podDetails?.State === "running" ? (
                      <Label
                        className="run-class"
                        variant="outline"
                        color={"blue"}
                        icon={<SyncAltIcon />}
                      >
                        RUNNING
                      </Label>
                    ) : (
                      podDetails?.State
                    )}
                  </Td>
                  <Td>
                    {podDetails?.State === "running" ? (
                      <div className="flash-box">
                        <div className="dot-flashing"></div>
                      </div>
                    ) : (
                      <PODStatus pod_status={podDetails?.ExitCode} />
                    )}
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={8}>
                  <Bullseye>
                    <EmptyStateTable
                      message={
                        "No experiment has been started. Start a new experiment to view the details."
                      }
                    />
                  </Bullseye>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </div>
    </>
  );
};

export default DetailsTable;
