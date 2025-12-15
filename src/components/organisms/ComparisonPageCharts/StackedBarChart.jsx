import React from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function GroupedBarChart({ data }) {
  // Extract cloud keys dynamically from data
  const cloudKeys = Object.keys(data[0]).filter((k) => k !== "version");

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="version" />
        <YAxis />
        <Tooltip />
        <Legend />

        {cloudKeys.map((key) => (
          <Bar key={key} dataKey={key} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
