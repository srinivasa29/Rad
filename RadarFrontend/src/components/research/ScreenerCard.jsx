import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, BookmarkCheck, ShieldCheck, Trash2 } from "lucide-react";

const trendTone = {
  Bullish: "border-emerald-400/35 bg-emerald-400/15 text-emerald-200",
  Bearish: "border-rose-400/35 bg-rose-400/15 text-rose-200",
  Sideways: "border-amber-300/35 bg-amber-300/15 text-amber-100",
};

const strengthTone = {
  Strong: "text-emerald-200",
  Moderate: "text-amber-100",
  Weak: "text-rose-200",
};

const formatPrice = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatPercent = (value) => `${value >= 0 ? "+" : ""}${Number(value || 0).toFixed(2)}%`;

const toneForTimeframe = (value) =>
  value === "Bullish" ? "text-emerald-300" : value === "Bearish" ? "text-rose-300" : "text-amber-200";

const ScreenerCard = ({ stock, expanded, onToggleExpand, onDelete, onToggleWatchlist, isBookmarked }) => {
  const trendClass = trendTone[stock.trend] || trendTone.Sideways;
  const strengthClass = strengthTone[stock.strength] || "text-slate-200";
  const changeClass = stock.change >= 0 ? "text-emerald-300" : "text-rose-300";

  return (
    <motion.article
      layout
      whileHover={{ y: -4, scale: 1.01 }}
      className="group h-full rounded-2xl border border-white/10 bg-[linear-gradient(160deg,rgba(15,23,42,0.92),rgba(16,33,60,0.8))] p-4 shadow-[0_16px_38px_rgba(0,0,0,0.32)] transition duration-300 ease-in-out hover:border-cyan-300/25 hover:shadow-[0_0_24px_rgba(34,211,238,0.16)] md:p-6"
    >
      <div className="flex h-full flex-col">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{stock.sector}</div>
            <h4 className="mt-1 text-lg font-black tracking-tight text-white">{stock.name}</h4>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleWatchlist}
              className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition duration-300 ease-in-out hover:border-cyan-300/35 hover:text-cyan-100"
              title="Watchlist"
            >
              {isBookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition duration-300 ease-in-out hover:border-rose-300/35 hover:text-rose-200"
              title="Delete"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="text-xl font-black text-white">{formatPrice(stock.price)}</div>
          <div className={`text-sm font-bold ${changeClass}`}>{formatPercent(stock.change)}</div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <span className={`rounded-lg border px-2.5 py-2 text-xs font-semibold ${trendClass}`}>{stock.trend}</span>
          <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-slate-200">
            Strength: <span className={strengthClass}>{stock.strength}</span>
          </span>
          <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-slate-200">Volatility: {stock.volatility}</span>
          <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-slate-200">
            <ShieldCheck size={12} className="text-cyan-200" />
            Confidence: {stock.confidence}%
          </span>
        </div>

        <div className="mb-4 rounded-xl border border-white/10 bg-slate-950/45 p-3">
          <div className="mb-2 text-[10px] uppercase tracking-[0.14em] text-slate-400">Entry / Target / Stop Loss</div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-slate-200">
              <div className="text-slate-400">Entry</div>
              <div className="mt-1 font-semibold text-cyan-100">{stock.entry}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-slate-200">
              <div className="text-slate-400">Target</div>
              <div className="mt-1 font-semibold text-emerald-200">{stock.target}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-slate-200">
              <div className="text-slate-400">Stop Loss</div>
              <div className="mt-1 font-semibold text-rose-200">{stock.stopLoss}</div>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Key Observations</div>
            <ul className="mt-1 space-y-1 text-slate-200">
              {stock.observations.slice(0, 3).map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Insight Summary</div>
            <p className="mt-1 leading-relaxed text-slate-200">{stock.insight}</p>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">What to Watch</div>
            <p className="mt-1 leading-relaxed text-cyan-100">{stock.whatToWatch}</p>
          </div>
        </div>

        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={onToggleExpand}
            className="w-full rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition duration-300 ease-in-out hover:bg-cyan-400/20"
          >
            View Details
          </button>
        </div>

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
                    <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Pattern Type</div>
                    <div className="mt-2 text-sm text-violet-100">{stock.pattern}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.article>
  );
};

export default ScreenerCard;
