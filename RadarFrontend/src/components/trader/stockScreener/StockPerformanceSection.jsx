import { motion } from "framer-motion";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tooltipStyle = {
  background: "#111827",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#ffffff",
  borderRadius: "8px",
};

export default function StockPerformanceSection({ stock, traderMode = false }) {
  const chartData = Array.isArray(stock?.history) ? stock.history : [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-white/5 bg-[#111827] p-4 shadow-[0_8px_28px_rgba(0,0,0,0.14)]"
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{traderMode ? "Intraday Trend" : "Performance"}</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{stock?.symbol || "Select a stock"}</h3>
        </div>
        <p className="text-sm text-gray-400">{traderMode ? "7-day momentum snapshot" : "6D trend snapshot"}</p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="label" stroke="#6b7280" tickLine={false} axisLine={false} />
            <YAxis stroke="#6b7280" tickLine={false} axisLine={false} domain={["auto", "auto"]} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`₹${Number(value).toFixed(2)}`, "Price"]} />
            <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2.2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
}
