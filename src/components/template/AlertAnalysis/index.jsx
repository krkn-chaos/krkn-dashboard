import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Thead, Tbody, Tr, Th, Td } from "@patternfly/react-table";
import { fetchAlertsData } from "@/actions/alertsActions";
import {
  Button,
  Label,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
  TextInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Tooltip,
} from "@patternfly/react-core";

const SEVERITY_OPTIONS = ["critical", "error", "warning", "good", "perfect"];

const getRiskClass = (riskLevel) => {
  const s = String(riskLevel || "").toLowerCase();
  if (s === "critical") return "red";
  if (s === "error") return "orange";
  if (s === "warning") return "gold";
  if (s === "good") return "cyan";
  if (s === "perfect") return "green";
  return "grey";
};

const AlertAnalysis = () => {
  const dispatch = useDispatch();
  const { alerts } = useSelector((state) => state.summary);

  const [uuidFilter, setUuidFilter] = useState("");
  const [alertFilter, setAlertFilter] = useState("");
  const [scenarioFilter, setScenarioFilter] = useState([]);
  const [severityFilter, setSeverityFilter] = useState([]);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [severityOpen, setSeverityOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchAlertsData());
  }, [dispatch]);

  const scenarioOptions = useMemo(() => {
    if (!alerts?.alerts) return [];
    return [...new Set(alerts.alerts.map((a) => a.scenario_type).filter(Boolean))];
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    if (!alerts?.alerts) return [];
    return alerts.alerts.filter((alert) => {
      if (uuidFilter && !String(alert.run_uuid || "").toLowerCase().includes(uuidFilter.toLowerCase()))
        return false;
      if (alertFilter && !String(alert.alert || "").toLowerCase().includes(alertFilter.toLowerCase()))
        return false;
      if (scenarioFilter.length > 0 && !scenarioFilter.includes(alert.scenario_type))
        return false;
      if (severityFilter.length > 0 && !severityFilter.includes(String(alert.severity || "").toLowerCase()))
        return false;
      return true;
    });
  }, [alerts, uuidFilter, alertFilter, scenarioFilter, severityFilter]);

  const toggleScenario = (value) =>
    setScenarioFilter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );

  const toggleSeverity = (value) =>
    setSeverityFilter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );

  const clearAllFilters = () => {
    setUuidFilter("");
    setAlertFilter("");
    setScenarioFilter([]);
    setSeverityFilter([]);
  };

  const hasFilters =
    uuidFilter || alertFilter || scenarioFilter.length > 0 || severityFilter.length > 0;

  const columns = ["UUID", "Scenario Type", "Alert Message", "Severity"];

  if (!alerts || !alerts.alerts) {
    return <div>No alerts data found.</div>;
  }

  return (
    <>
      <Toolbar id="alert-filter-toolbar">
        <ToolbarContent>
          <ToolbarItem>
            <TextInput
              aria-label="Filter by UUID"
              placeholder="Filter by UUID"
              value={uuidFilter}
              onChange={(_e, val) => setUuidFilter(val)}
              style={{ width: "200px" }}
            />
          </ToolbarItem>
          <ToolbarItem>
            <TextInput
              aria-label="Filter by alert message"
              placeholder="Filter by alert message"
              value={alertFilter}
              onChange={(_e, val) => setAlertFilter(val)}
              style={{ width: "240px" }}
            />
          </ToolbarItem>
          <ToolbarItem>
            <Select
              isOpen={scenarioOpen}
              selected={scenarioFilter}
              onOpenChange={(o) => setScenarioOpen(o)}
              toggle={(ref) => (
                <MenuToggle
                  ref={ref}
                  onClick={() => setScenarioOpen(!scenarioOpen)}
                  isExpanded={scenarioOpen}
                  style={{ width: "200px" }}
                >
                  {scenarioFilter.length > 0
                    ? `Scenario Type (${scenarioFilter.length})`
                    : "Scenario Type"}
                </MenuToggle>
              )}
            >
              <SelectList>
                {scenarioOptions.map((s) => (
                  <SelectOption
                    key={s}
                    value={s}
                    isSelected={scenarioFilter.includes(s)}
                    hasCheckbox
                    onClick={() => toggleScenario(s)}
                  >
                    {s}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </ToolbarItem>
          <ToolbarItem>
            <Select
              isOpen={severityOpen}
              selected={severityFilter}
              onOpenChange={(o) => setSeverityOpen(o)}
              toggle={(ref) => (
                <MenuToggle
                  ref={ref}
                  onClick={() => setSeverityOpen(!severityOpen)}
                  isExpanded={severityOpen}
                  style={{ width: "180px" }}
                >
                  {severityFilter.length > 0
                    ? `Severity (${severityFilter.length})`
                    : "Severity"}
                </MenuToggle>
              )}
            >
              <SelectList>
                {SEVERITY_OPTIONS.map((s) => (
                  <SelectOption
                    key={s}
                    value={s}
                    isSelected={severityFilter.includes(s)}
                    hasCheckbox
                    onClick={() => toggleSeverity(s)}
                  >
                    <Label color={getRiskClass(s)} isCompact>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Label>
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </ToolbarItem>
          {hasFilters && (
            <ToolbarItem>
              <Button variant="link" onClick={clearAllFilters}>
                Clear filters
              </Button>
            </ToolbarItem>
          )}
        </ToolbarContent>
      </Toolbar>
      <Table aria-label="Alert Analysis Table">
        <Thead>
          <Tr>
            {columns.map((column, columnIndex) => (
              <Th key={columnIndex}>{column}</Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert, rowIndex) => {
              const sev = String(alert.severity ?? "N/A");
              return (
                <Tr key={rowIndex}>
                  <Td dataLabel={columns[0]}>{alert.run_uuid || "—"}</Td>
                  <Td dataLabel={columns[1]}>{alert.scenario_type}</Td>
                  <Td dataLabel={columns[2]}>
                    <Tooltip content={alert.alert}>
                      <span>
                        {alert.alert && alert.alert.length > 85
                          ? `${alert.alert.substring(0, 85)}...`
                          : alert.alert}
                      </span>
                    </Tooltip>
                  </Td>
                  <Td dataLabel={columns[3]}>
                    <Label color={getRiskClass(alert.severity)}>
                      {sev.charAt(0).toUpperCase() + sev.slice(1)}
                    </Label>
                  </Td>
                </Tr>
              );
            })
          ) : (
            <Tr>
              <Td colSpan={4} style={{ textAlign: "center" }}>
                No alerts match the current filters.
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>
    </>
  );
};

export default AlertAnalysis;
