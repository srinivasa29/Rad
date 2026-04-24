import { motion } from "framer-motion";

function MiniTrend({ positive = true }) {
  return (
    <div className="mt-2 flex h-8 items-end gap-1">
      {[3, 5, 4, 6, 5, 7].map((value, index) => {
        const height = positive ? value : 8 - value;
        return (
          <span
            key={`${value}-${index}`}
            className={`w-1.5 rounded-sm ${positive ? "bg-green-400/70" : "bg-red-400/70"}`}
            style={{ height: `${height * 4}px` }}
          />
        );
      })}
    </div>
  );
}

function Bucket({ title, rows, tone }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#111827] p-4 shadow-[0_6px_24px_rgba(0,0,0,0.12)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{title}</p>
      <div className="mt-3 space-y-3">
        {rows.map((row) => (
          <div key={row.symbol} className="rounded-lg border border-white/5 bg-[#0f172a] px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">{row.symbol}</span>
              <span className={`text-sm font-semibold ${tone}`}>{row.change > 0 ? "+" : ""}{row.change?.toFixed(2)}%</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
              <span>{row.name}</span>
              <span>Vol {Number(row.volume || 0).toLocaleString("en-IN")}</span>
            </div>
            <MiniTrend positive={row.change >= 0} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TopMoversSection({ gainers, losers, mostActive }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.25 }}
      className="space-y-3"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Market Pulse</p>
      <div className="grid gap-3 lg:grid-cols-3">
        <Bucket title="Top Gainers" rows={gainers} tone="text-green-400" />
        <Bucket title="Top Losers" rows={losers} tone="text-red-400" />
        <Bucket title="Most Active" rows={mostActive} tone="text-blue-300" />
      </div>
    </motion.section>
  );
}

export { TopMoversSection };
export default TopMoversSection;
