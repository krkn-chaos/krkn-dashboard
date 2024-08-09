import "@patternfly/react-core/dist/styles/base.css";

import { DownloadIcon, SyncAltIcon } from "@patternfly/react-icons";
import React, { useEffect } from "react";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { downloadLogs, getDetails } from "@/actions/newExperiment";
import { useDispatch, useSelector } from "react-redux";

import { Button } from "@patternfly/react-core";
import { Label } from "@patternfly/react-core";
import PODStatus from "@/components/Overview/PODStatus";
import { uid } from "@/actions/toastActions.js";

const Results = () => {
  const dispatch = useDispatch();
  const results = useSelector((state) => state.experiment.results);

  const columnNames = {
    containerID: "Container ID",
    image: "Image",
    name: "Name",
    mount: "Mounts",
    state: "State",
    status: "Status",
  };

  useEffect(() => {
    dispatch(getDetails());
  }, [dispatch]);
  return (
    <>
      {results?.length > 0 && (
        <Table variant="default" borders="default" isStriped>
          <Thead>
            <Tr>
              <Th width={10}>{columnNames.containerID}</Th>
              <Th width={30}>{columnNames.image}</Th>
              <Th width={5}>{columnNames.name}</Th>
              <Th width={15}>{columnNames.mount}</Th>
              <Th width={10}>{columnNames.state}</Th>
              <Th width={10}>{columnNames.status}</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {results.map((podDetails) => (
              <Tr key={uid()}>
                <Td>{podDetails.container_id?.toString()?.substr(0, 8)}</Td>
                <Td>{podDetails.image}</Td>

                <Td>{podDetails.name}</Td>
                <Td>{podDetails.mounts}</Td>
                <Td className="state-class">
                  {podDetails.state === "running" ? (
                    <Label
                      className="run-class"
                      variant="outline"
                      color={"blue"}
                      icon={<SyncAltIcon />}
                    >
                      RUNNING
                    </Label>
                  ) : (
                    podDetails.state
                  )}
                </Td>
                <Td>
                  {podDetails.state === "running" ? (
                    <div className="flash-box">
                      <div className="dot-flashing"></div>
                    </div>
                  ) : (
                    <PODStatus pod_status={podDetails.status} />
                  )}
                </Td>
                <Td>
                  <Button
                    variant="link"
                    icon={<DownloadIcon />}
                    iconPosition="end"
                    onClick={() =>
                      dispatch(
                        downloadLogs(podDetails.container_id, podDetails.name)
                      )
                    }
                  >
                    Logs
                  </Button>{" "}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </>
  );
};
export default Results;
