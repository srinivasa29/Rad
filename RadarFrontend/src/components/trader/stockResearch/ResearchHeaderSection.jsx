const badgeTone = {
  Bullish: "border-emerald-400/30 bg-emerald-400/15 text-emerald-100",
  Bearish: "border-rose-400/30 bg-rose-400/15 text-rose-100",
  Sideways: "border-amber-300/30 bg-amber-300/15 text-amber-100",
  Strong: "border-cyan-300/30 bg-cyan-400/15 text-cyan-100",
  Moderate: "border-amber-300/30 bg-amber-300/15 text-amber-100",
  Weak: "border-rose-400/30 bg-rose-400/15 text-rose-100",
  Positive: "border-emerald-400/30 bg-emerald-400/15 text-emerald-100",
  Neutral: "border-amber-300/30 bg-amber-300/15 text-amber-100",
  Negative: "border-rose-400/30 bg-rose-400/15 text-rose-100",
};

const ResearchHeaderSection = ({ stock }) => {
  const changeClass = stock.changePercent >= 0 ? "text-emerald-300" : "text-rose-300";

  return (
    <section className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(11,20,36,0.85),rgba(15,31,54,0.72))] p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{stock.exchange}</div>
          <h1 className="mt-1 text-2xl font-black text-white md:text-3xl">{stock.name}</h1>
          <div className="mt-1 text-sm text-slate-300">{stock.symbol}</div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-black text-white md:text-3xl">₹{stock.price.toLocaleString("en-IN")}</div>
          <div className={`text-sm font-bold ${changeClass}`}>{stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
        <span className={`rounded-full border px-3 py-1 ${badgeTone[stock.trend] || badgeTone.Sideways}`}>Trend: {stock.trend}</span>
        <span className={`rounded-full border px-3 py-1 ${badgeTone[stock.strength] || badgeTone.Moderate}`}>Strength: {stock.strength}</span>
        <span className={`rounded-full border px-3 py-1 ${badgeTone[stock.sentiment] || badgeTone.Neutral}`}>Sentiment: {stock.sentiment}</span>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-slate-200 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">Volume: <span className="text-white">{stock.volume}</span></div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">ATR: <span className="text-white">{stock.atr}</span></div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">Day Range: <span className="text-white">{stock.dayRange}</span></div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">Market: <span className="text-white">{stock.marketStatus}</span></div>
      </div>
    </section>
  );
};

export default ResearchHeaderSection;
