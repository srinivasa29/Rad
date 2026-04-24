const FundamentalsCompactSection = ({ fundamentals }) => {
  return (
    <section className="rounded-2xl border border-white/10 bg-[rgba(10,18,34,0.82)] p-4 md:p-6">
      <h2 className="text-sm font-black uppercase tracking-[0.16em] text-white">Fundamentals</h2>
      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4 text-sm">
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-slate-200">Revenue: <span className="text-white">{fundamentals.revenue}</span></div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-slate-200">Profit: <span className="text-white">{fundamentals.profit}</span></div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-slate-200">Growth: <span className="text-white">{fundamentals.growth}</span></div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-slate-200">CEO: <span className="text-white">{fundamentals.ceo}</span></div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-slate-200">Founded: <span className="text-white">{fundamentals.founded}</span></div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-slate-200">HQ: <span className="text-white">{fundamentals.hq}</span></div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-slate-200">Employees: <span className="text-white">{fundamentals.employees}</span></div>
      </div>
    </section>
  );
};

export default FundamentalsCompactSection;
