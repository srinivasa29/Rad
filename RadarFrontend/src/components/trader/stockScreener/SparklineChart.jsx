import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";

export function SparklineChart({ data = [], color = "#3b82f6" }) {
  const chartData = Array.isArray(data) ? data.map((value, index) => ({ index, value })) : [];

  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Tooltip cursor={false} content={() => null} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.8} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
