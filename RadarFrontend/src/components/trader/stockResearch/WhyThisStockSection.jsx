const WhyThisStockSection = ({ points }) => {
  return (
    <section className="rounded-2xl border border-white/10 bg-[rgba(10,18,34,0.82)] p-4 md:p-6">
      <h2 className="text-sm font-black uppercase tracking-[0.16em] text-white">Why This Stock</h2>
      <ul className="mt-3 space-y-2 text-sm text-slate-200">
        {points.map((point) => (
          <li key={point} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">- {point}</li>
        ))}
      </ul>
    </section>
  );
};

export default WhyThisStockSection;
