const SectorFilter = ({ sectors, selectedSector, onSelect }) => {
  return (
    <div>
      <div className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-400">Sector</div>
      <div className="flex flex-wrap gap-2">
        {sectors.map((sector) => (
          <button
            key={sector}
            type="button"
            onClick={() => onSelect(sector)}
            className={`rounded-lg border px-2.5 py-1.5 text-xs transition duration-300 ease-in-out ${
              selectedSector === sector
                ? "border-cyan-300/35 bg-cyan-400/15 text-cyan-100"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
            }`}
          >
            {sector}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SectorFilter;
