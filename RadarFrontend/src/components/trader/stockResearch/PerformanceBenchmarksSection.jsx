const PerformanceBenchmarksSection = ({ performance }) => {
  const labels = ["1D", "1W", "1M", "6M", "1Y"];

  return (
    <section className="rounded-2xl border border-white/10 bg-[rgba(10,18,34,0.82)] p-4 md:p-6">
      <h2 className="text-sm font-black uppercase tracking-[0.16em] text-white">Performance Benchmarks</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5 text-sm">
        {labels.map((label) => (
          <div key={label} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center">
            <div className="text-xs text-slate-400">{label}</div>
            <div className="mt-1 font-semibold text-cyan-100">{performance[label]}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PerformanceBenchmarksSection;
