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

	console.log("Alerts Data:", alerts);

	const columns = ["Scenario Type", "Alert Message", "Severity"];

	if (!alerts || !alerts.alerts) {
		return <div>No alerts data found.</div>;
	}
	const getRiskClass = (riskLevel) => {
		if (riskLevel === "critical") return "red";
		if (riskLevel === "error") return "orange";
		if (riskLevel === "warning") return "gold";
		if (riskLevel === "Good") return "cyan";
		if (riskLevel === "Perfect") return "green";
		return "risk-low";
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
					alerts.alerts.map((alert, rowIndex) => (
						<Tr key={rowIndex}>
							<Td dataLabel={columns[0]}>{alert.scenario_type}</Td>
							<Td dataLabel={columns[1]}>
								<Tooltip content={alert.alert}>
									<span>
										{alert.alert.length > 85
											? `${alert.alert.substring(0, 85)}...`
											: alert.alert}
									</span>
								</Tooltip>
							</Td>
							<Td dataLabel={columns[2]}>
								<Label color={getRiskClass(alert.severity)}>
									{alert.severity.charAt(0).toUpperCase() +
										alert.severity.slice(1)}
								</Label>
							</Td>
						</Tr>
					))}
			</Tbody>
		</Table>
	);
};

export default AlertAnalysis;
