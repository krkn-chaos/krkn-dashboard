import { Table, Tr, Td, Th, Thead } from "@patternfly/react-table";
import { Label } from "@patternfly/react-core";
import React, { useMemo } from "react";

const ScenarioRiskTable = (props) => {
	const { data, title } = props;
	const tableData = useMemo(() => {
		if (!data) return [];

		return data.map((item) => {
			const success = item["1"];
			const failure = item["0"];
			const { total, key } = item;
			const successRate = total === 0 ? 0 : (success / total) * 100;

			// Determine the risk level based on the success rate
			let riskLevel;
			if (successRate < 70) {
				riskLevel = "High Risk";
			} else if (successRate < 85) {
				riskLevel = "Medium Risk";
			} else if (successRate < 90) {
				riskLevel = "Warning";
			} else {
				riskLevel = successRate < 100 ? "Good" : "Perfect";
			}

			return {
				name: key
					.replace(/_/g, " ")
					.replace(/\b\w/g, (l) => l.toUpperCase())
					.replace(/ Scenarios?/gi, "")
					.trim(),
				total,
				failures: failure,
				successRate,
				riskLevel,
			};
		});
	}, [data]);

	// Helper function to get the correct CSS class for the risk level
	const getRiskClass = (riskLevel) => {
		if (riskLevel === "High Risk") return "red";
		if (riskLevel === "Medium Risk") return "orange";
		if (riskLevel === "Warning") return "gold";
		if (riskLevel === "Good") return "cyan";
		if (riskLevel === "Perfect") return "green";
		return "risk-low";
	};

	return (
		<div className="table-container">
			<h3>{props.title}</h3>
			<Table className="risk-table" variant="compact">
				<Thead>
					<Tr>
						<Th>{props.column1}</Th>
						<Th>Total Runs</Th>
						<Th>Failures</Th>
						<Th>Success Rate</Th>
						<Th>Risk Level</Th>
					</Tr>
				</Thead>
				<tbody>
					{tableData.map((item) => (
						<Tr key={item.name}>
							<Td>{item.name}</Td>
							<Td>{item.total}</Td>
							<Td>{item.failures || 0}</Td>
							<Td>{item.successRate.toFixed(2)}%</Td>
							<Td>
								<Label color={getRiskClass(item.riskLevel)}>
									{item.riskLevel}
								</Label>
							</Td>
						</Tr>
					))}
				</tbody>
			</Table>
		</div>
	);
};

export default ScenarioRiskTable;
