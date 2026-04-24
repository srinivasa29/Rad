import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Activity } from "lucide-react";

const trendTone = {
  Bullish: "text-emerald-300 border-emerald-400/25 bg-emerald-400/10",
  Bearish: "text-rose-300 border-rose-400/25 bg-rose-400/10",
  Sideways: "text-amber-200 border-amber-300/25 bg-amber-300/10",
};

const strengthTone = {
  Strong: "text-emerald-300",
  Moderate: "text-amber-200",
  Weak: "text-rose-300",
};

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatPercent = (value) => `${value >= 0 ? "+" : ""}${Number(value || 0).toFixed(2)}%`;
const toneForTimeframe = (value) => value === "Bullish" ? "text-emerald-300" : value === "Bearish" ? "text-rose-300" : "text-amber-200";

const ResearchStockCard = ({ stock, expanded, onToggle }) => {
  const trendClass = trendTone[stock.trend] || trendTone.Sideways;
  const strengthClass = strengthTone[stock.strength] || "text-slate-200";
  const changeClass = stock.change >= 0 ? "text-emerald-300" : "text-rose-300";
  const patternList = Array.isArray(stock.patterns)
    ? stock.patterns
    : stock.pattern
      ? [stock.pattern]
      : [];

  return (
    <motion.article
      layout
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(17,24,39,0.8),rgba(15,23,42,0.72))] p-5 backdrop-blur-lg shadow-[0_14px_32px_rgba(0,0,0,0.28)]"
    >
      <button type="button" onClick={onToggle} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{stock.sector}</div>
            <h4 className="mt-1 text-xl font-black tracking-tight text-white">{stock.name}</h4>
          </div>
          <div className="text-right">
            <div className="text-lg font-black text-white">{formatPrice(stock.price)}</div>
            <div className={`text-sm font-bold ${changeClass}`}>{formatPercent(stock.change)}</div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <span className={`rounded-xl border px-3 py-2 text-xs font-semibold ${trendClass}`}>Trend: {stock.trend}</span>
          <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200">Strength: <span className={strengthClass}>{stock.strength}</span></span>
          <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200">Volatility: {stock.volatility}</span>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Key Observations</div>
            <ul className="mt-1 space-y-1 text-sm text-slate-200">
              {stock.observations.slice(0, 3).map((item) => (
                <li key={item} className="truncate">- {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Insight Summary</div>
            <p className="mt-1 text-sm text-slate-200 leading-relaxed">{stock.insight}</p>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">What to Watch</div>
            <p className="mt-1 text-sm text-cyan-100 leading-relaxed">{stock.whatToWatch}</p>
          </div>
        </div>

        <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-100">
          <Activity size={12} />
          Expand Analysis
          <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      <AnimatePresence>
        {expanded ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Multi-timeframe Trend</div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    {Object.entries(stock.timeframes).map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-white/10 bg-slate-950/40 px-2 py-1.5 text-center">
                        <div className="text-slate-400">{label}</div>
                        <div className={`font-semibold ${toneForTimeframe(value)}`}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Indicators</div>
                  <div className="mt-2 space-y-1 text-sm text-slate-200">
                    <div>RSI: {stock.rsi}</div>
                    <div>MACD: {stock.macd}</div>
                    <div>Volume: {stock.volume.toLocaleString("en-IN")}</div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Support & Resistance</div>
                  <div className="mt-2 text-sm text-slate-200">Support: {stock.levels.support.join(" / ")}</div>
                  <div className="text-sm text-slate-200">Resistance: {stock.levels.resistance.join(" / ")}</div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Pattern Detection</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {patternList.map((pattern) => (
                      <span key={pattern} className="rounded-full border border-violet-300/25 bg-violet-400/10 px-2.5 py-1 text-xs text-violet-100">
                        {pattern}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
};

export default ResearchStockCard;
