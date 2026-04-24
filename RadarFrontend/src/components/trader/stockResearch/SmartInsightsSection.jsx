const SmartInsightsSection = ({ insights }) => {
  return (
    <section className="rounded-2xl border border-white/10 bg-[rgba(10,18,34,0.82)] p-4 md:p-6">
      <h2 className="text-sm font-black uppercase tracking-[0.16em] text-white">Smart Insights</h2>
      <div className="mt-3 space-y-2 text-sm">
        {insights.map((insight) => (
          <div key={insight} className="rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-cyan-100">
            {insight}
          </div>
        ))}
      </div>
    </section>
  );
};

export default SmartInsightsSection;
