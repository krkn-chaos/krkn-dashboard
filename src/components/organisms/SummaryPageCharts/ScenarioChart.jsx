import React from "react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";

const ScenarioChart = ({ data }) => {
	const chartData = data.map((item) => ({
		name: item.key
			.replace(/_/g, " ")
			.replace(/\b\w/g, (l) => l.toUpperCase())
			.replace(/ Scenarios?/gi, "")
			.trim(),
		success: item?.["1"],
		failure: item?.["0"],
	}));

	return (
		<>
			<div
				style={{ flex: 1, height: "450px", width: "100%" }}
				className="chartWrapperStyle"
			>
				<h3 style={{ textAlign: "center" }}>Distribution by Scenario Type</h3>
				<ResponsiveContainer width="100%" height={400}>
					<BarChart
						data={chartData}
						margin={{
							top: 20,
							right: 30,
							left: 20,
							bottom: 5,
						}}
					>
						<CartesianGrid strokeDasharray="3 3" />
						<YAxis type="number" />
						<XAxis
							type="category"
							dataKey="name"
							width={250}
							interval={0}
							tick={{ fontSize: 12 }}
						/>
						<Tooltip />
						<Legend />
						<Bar dataKey="success" stackId="a" fill="#AEC6CF" />
						<Bar dataKey="failure" stackId="a" fill="#C19A6B" />
					</BarChart>
				</ResponsiveContainer>
			</div>
		</>
	);
};

export default ScenarioChart;
