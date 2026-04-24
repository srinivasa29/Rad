const signalTone = {
  Bullish: "text-emerald-200 border-emerald-400/30 bg-emerald-400/15",
  Neutral: "text-amber-100 border-amber-300/30 bg-amber-300/15",
  Bearish: "text-rose-200 border-rose-400/30 bg-rose-400/15",
};

const TechnicalSnapshotSection = ({ snapshot }) => {
  return (
    <section className="rounded-2xl border border-white/10 bg-[rgba(10,18,34,0.82)] p-4 md:p-6">
      <h2 className="text-sm font-black uppercase tracking-[0.16em] text-white">Technical Snapshot</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs uppercase text-slate-400">RSI</div>
          <div className="mt-1 text-lg font-bold text-white">{snapshot.rsi.value}</div>
          <div className="text-xs text-slate-300">{snapshot.rsi.label}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs uppercase text-slate-400">MACD</div>
          <div className="mt-1 text-sm font-semibold text-white">{snapshot.macd}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs uppercase text-slate-400">SMA/EMA</div>
          <div className="mt-1 text-sm font-semibold text-white">{snapshot.smaEmaAlignment}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs uppercase text-slate-400">Volume</div>
          <div className="mt-1 text-sm font-semibold text-white">{snapshot.volumeStatus}</div>
        </div>
        <div className={`rounded-xl border p-3 ${signalTone[snapshot.finalSignal] || signalTone.Neutral}`}>
          <div className="text-xs uppercase">Final Signal</div>
          <div className="mt-1 text-base font-black">{snapshot.finalSignal}</div>
        </div>
      </div>
    </section>
  );
};

export default TechnicalSnapshotSection;
