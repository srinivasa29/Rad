const KeyLevelsSection = ({ levels }) => {
  return (
    <section className="rounded-2xl border border-white/10 bg-[rgba(10,18,34,0.82)] p-4 md:p-6">
      <h2 className="text-sm font-black uppercase tracking-[0.16em] text-white">Key Levels</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-sm">
        <div className="rounded-xl border border-rose-300/25 bg-rose-400/10 p-3 text-rose-100">R1: {levels.resistance.r1}</div>
        <div className="rounded-xl border border-rose-300/25 bg-rose-400/10 p-3 text-rose-100">R2: {levels.resistance.r2}</div>
        <div className="rounded-xl border border-emerald-300/25 bg-emerald-400/10 p-3 text-emerald-100">S1: {levels.support.s1}</div>
        <div className="rounded-xl border border-emerald-300/25 bg-emerald-400/10 p-3 text-emerald-100">S2: {levels.support.s2}</div>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-slate-200">Volatility: <span className="text-white">{levels.volatility}</span></div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-slate-200">Risk Level: <span className="text-white">{levels.riskLevel}</span></div>
      </div>
    </section>
  );
};

export default KeyLevelsSection;
