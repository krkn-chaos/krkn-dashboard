import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Thead, Tbody, Tr, Th, Td } from "@patternfly/react-table";
import { fetchAlertsData } from "@/actions/alertsActions";
import { Label, Tooltip } from "@patternfly/react-core";

const AlertAnalysis = () => {
  const dispatch = useDispatch();
  const { alerts } = useSelector((state) => state.summary);

  useEffect(() => {
    dispatch(fetchAlertsData());
  }, [dispatch]);

  const columns = ["Scenario Type", "Alert Message", "Severity"];

  if (!alerts || !alerts.alerts) {
    return <div>No alerts data found.</div>;
  }

  const getRiskClass = (riskLevel) => {
    const s = String(riskLevel || "").toLowerCase();
    if (s === "critical") return "red";
    if (s === "error") return "orange";
    if (s === "warning") return "gold";
    if (s === "good") return "cyan";
    if (s === "perfect") return "green";
    return "grey";
  };

  return (
    <Table aria-label="Alert Analysis Table">
      <Thead>
        <Tr>
          {columns.map((column, columnIndex) => (
            <Th key={columnIndex}>{column}</Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {alerts.alerts.length > 0 &&
          alerts.alerts.map((alert, rowIndex) => {
            const sev = String(alert.severity ?? "N/A");
            return (
              <Tr key={rowIndex}>
                <Td dataLabel={columns[0]}>{alert.scenario_type}</Td>
                <Td dataLabel={columns[1]}>
                  <Tooltip content={alert.alert}>
                    <span>
                      {alert.alert && alert.alert.length > 85
                        ? `${alert.alert.substring(0, 85)}...`
                        : alert.alert}
                    </span>
                  </Tooltip>
                </Td>
                <Td dataLabel={columns[2]}>
                  <Label color={getRiskClass(alert.severity)}>
                    {sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </Label>
                </Td>
              </Tr>
            );
          })}
      </Tbody>
    </Table>
  );
};

export default AlertAnalysis;
