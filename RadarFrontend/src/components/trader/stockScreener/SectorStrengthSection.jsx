import { motion } from "framer-motion";

export default function SectorStrengthSection({ rows = [] }) {
  const sectorMap = rows.reduce((acc, row) => {
    const sector = row.sector || "--";
    if (!acc[sector]) {
      acc[sector] = { sector, count: 0, changeSum: 0 };
    }
    acc[sector].count += 1;
    acc[sector].changeSum += Number(row.change || 0);
    return acc;
  }, {});

  const sectors = Object.values(sectorMap)
    .map((item) => ({ ...item, avgChange: item.count ? item.changeSum / item.count : 0 }))
    .sort((a, b) => b.avgChange - a.avgChange)
    .slice(0, 5);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-white/5 bg-[#111827] p-4 shadow-[0_8px_28px_rgba(0,0,0,0.14)]"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Sector Strength</p>
      <div className="mt-3 space-y-2">
        {sectors.map((item) => (
          <div key={item.sector} className="rounded-lg border border-white/5 bg-[#0f172a] px-3 py-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-white">{item.sector}</span>
              <span className={item.avgChange >= 0 ? "text-green-400" : "text-red-400"}>{item.avgChange >= 0 ? "+" : ""}{item.avgChange.toFixed(2)}%</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-[#1f2937]">
              <div className={`h-1.5 rounded-full ${item.avgChange >= 0 ? "bg-green-400" : "bg-red-400"}`} style={{ width: `${Math.min(100, Math.abs(item.avgChange) * 18 + 20)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
