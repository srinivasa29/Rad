const ScannerControls = ({ tabs, activeTab, onTabChange, resultCount }) => {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onTabChange(tab)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition duration-300 ease-in-out ${
            activeTab === tab
              ? "border-cyan-300/40 bg-cyan-400/20 text-cyan-100"
              : "border-white/10 bg-slate-950/40 text-slate-300 hover:border-white/20"
          }`}
        >
          {tab}
        </button>
      ))}
      <span className="ml-auto text-xs text-slate-400">{resultCount} results</span>
    </div>
  );
};

export default ScannerControls;
