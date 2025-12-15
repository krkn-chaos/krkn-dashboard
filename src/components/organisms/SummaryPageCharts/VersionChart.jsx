import React, { useMemo } from "react";
import {
	RadialBarChart,
	RadialBar,
	Legend,
	Tooltip,
	ResponsiveContainer,
} from "recharts";

const COLORS = ["#8884d8", "#83a6ed", "#8dd1e1", "#82ca9d", "#a4de6c"];

const CustomTooltip = ({ active, payload }) => {
	if (active && payload && payload.length) {
		const data = payload[0].payload;
		return (
			<div
				style={{
					backgroundColor: "#fff",
					border: "1px solid #ccc",
					padding: "10px",
					borderRadius: "5px",
					boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
				}}
			>
				{/* Display the full name (e.g., "v4.19") */}
				<p
					style={{ margin: 0, fontWeight: "bold" }}
				>{`Version ${data.name.replace("v", "")}`}</p>

				{/* Display the formatted success rate */}
				<p style={{ margin: 0, color: data.fill }}>
					{`Success Rate: ${data.successRate.toFixed(1)}%`}
				</p>
			</div>
		);
	}

	return null;
};
const MajorVersionCharts = ({ data }) => {
	const chartData = useMemo(() => {
		if (!data) return [];

		const transformed = data.map((item, index) => {
			const success = item["1"] || 0;
			const total = item.total;
			const successRate = total === 0 ? 0 : (success / total) * 100;

			return {
				name: `v${item.key}`,
				successRate: successRate,
				fill: COLORS[index % COLORS.length],
			};
		});

		// Sort the data so the largest ring is on the outside, which looks best
		return transformed.sort((a, b) => b.successRate - a.successRate);
	}, [data]);

	if (chartData.length === 0) {
		return <p>No version data to display.</p>;
	}
	return (
		<div style={{ width: "100%", height: "400px" }}>
			<h3 style={{ textAlign: "center" }}>Success Rate by Version</h3>
			<ResponsiveContainer>
				<RadialBarChart
					cx="50%"
					cy="50%"
					innerRadius="20%"
					outerRadius="80%"
					barSize={25}
					data={chartData}
					startAngle={90}
					endAngle={-270}
				>
					<RadialBar
						minAngle={15}
						label={{
							position: "insideStart",
							fill: "#fff",
							formatter: (value) => `${value.toFixed(0)}%`,
						}}
						background
						dataKey="successRate"
					/>
					<Legend
						iconSize={10}
						layout="vertical"
						verticalAlign="middle"
						align="right"
					/>
					<Tooltip content={<CustomTooltip />} />
				</RadialBarChart>
			</ResponsiveContainer>
		</div>
	);
};

export default MajorVersionCharts;
