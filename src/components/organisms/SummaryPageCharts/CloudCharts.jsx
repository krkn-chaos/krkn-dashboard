import React, { useMemo } from "react";
import {
	PieChart,
	Pie,
	Cell,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import "./index.less";

const COLORS = ["#AEC6CF", "#C19A6B", "#B3B3B3", "#C8A2C8"];
const SUCCESS_COLOR = "#AEC6CF";
const FAILURE_COLOR = "#C19A6B";

const CloudCharts = (props) => {
	const { cloudType, cloudInfra } = props;
	const cloudTypeBarData = useMemo(() => {
		if (!cloudType) return [];
		return cloudType.map((item) => ({
			name: item.key.charAt(0).toUpperCase() + item.key.slice(1),
			success: item["0"],
			failure: item["1"],
		}));
	}, [cloudInfra]);

	const barChartData = useMemo(() => {
		if (!cloudInfra) return [];
		return cloudInfra.map((item) => ({
			name: item.key,
			success: item["0"],
			failure: item["1"],
		}));
	}, [cloudInfra]);

	return (
		<div className="cloud-charts-container">
			<div style={{ flex: 1, height: "400px" }} className="chartWrapperStyle">
				<h3 style={{ textAlign: "center" }}>Runs by Cloud Type</h3>
				<ResponsiveContainer>
					<BarChart
						data={cloudTypeBarData}
						margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
					>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="name" />
						<YAxis />
						<Tooltip />
						<Legend />
						<Bar dataKey="success" stackId="a" fill={SUCCESS_COLOR} />
						<Bar dataKey="failure" stackId="a" fill={FAILURE_COLOR} />
					</BarChart>
				</ResponsiveContainer>
			</div>

			{/* Bar Chart for Cloud Infrastructure */}
			<div style={{ flex: 1, height: "400px" }} className="chartWrapperStyle">
				<h3 style={{ textAlign: "center" }}>Runs by Cloud Infrastructure</h3>
				<ResponsiveContainer>
					<BarChart
						data={barChartData}
						margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
					>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="name" />
						<YAxis />
						<Tooltip />
						<Legend />
						<Bar dataKey="success" stackId="a" fill={SUCCESS_COLOR} />
						<Bar dataKey="failure" stackId="a" fill={FAILURE_COLOR} />
					</BarChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
};

export default CloudCharts;
