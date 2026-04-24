const tagTone = {
  Breakout: "border-emerald-300/30 bg-emerald-400/15 text-emerald-100",
  Pullback: "border-amber-300/30 bg-amber-300/15 text-amber-100",
  Momentum: "border-cyan-300/30 bg-cyan-400/15 text-cyan-100",
};

const RelatedSetupsSection = ({ setups }) => {
  return (
    <section className="rounded-2xl border border-white/10 bg-[rgba(10,18,34,0.82)] p-4 md:p-6">
      <h2 className="text-sm font-black uppercase tracking-[0.16em] text-white">Related Setups</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {setups.map((setup) => (
          <div key={`${setup.symbol}-${setup.tag}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <div className="text-sm font-semibold text-white">{setup.symbol}</div>
            <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs ${tagTone[setup.tag] || tagTone.Momentum}`}>
              {setup.tag}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RelatedSetupsSection;
