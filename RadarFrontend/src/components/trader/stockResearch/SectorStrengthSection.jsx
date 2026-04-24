const SectorStrengthSection = ({ sectorStrength }) => {
  return (
    <section className="rounded-2xl border border-white/10 bg-[rgba(10,18,34,0.82)] p-4 md:p-6">
      <h2 className="text-sm font-black uppercase tracking-[0.16em] text-white">Sector Strength</h2>
      <div className="mt-2 text-xs text-slate-400">Overall Trend: <span className="text-cyan-100">{sectorStrength.trend}</span></div>
      <div className="mt-3 space-y-2 text-sm">
        {sectorStrength.peers.map((peer) => (
          <div key={peer.symbol} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <span className="text-slate-100">{peer.symbol}</span>
            <span className={peer.changePercent >= 0 ? "text-emerald-300" : "text-rose-300"}>
              {peer.changePercent >= 0 ? "+" : ""}{peer.changePercent.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SectorStrengthSection;
