const EmptyState = ({ onRunScan }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
      <p className="text-sm text-slate-300">No results found. Adjust filters or run scan.</p>
      <button
        type="button"
        onClick={onRunScan}
        className="mt-4 rounded-lg border border-cyan-300/30 bg-cyan-400/15 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/25"
      >
        Run Scan
      </button>
    </div>
  );
};

export default EmptyState;
