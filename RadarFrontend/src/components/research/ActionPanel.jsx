import { Download, FolderPlus, Save } from "lucide-react";

const ActionPanel = ({ onSave, onExcel, onNewScan, isScanning }) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onSave}
        className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-100 transition duration-300 ease-in-out hover:border-cyan-300/30 hover:bg-cyan-400/10"
      >
        <Save size={13} /> Save
      </button>
      <button
        type="button"
        onClick={onExcel}
        className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-100 transition duration-300 ease-in-out hover:border-cyan-300/30 hover:bg-cyan-400/10"
      >
        <Download size={13} /> Excel
      </button>
      <button
        type="button"
        onClick={onNewScan}
        disabled={isScanning}
        className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-cyan-300/35 bg-cyan-400/15 px-3 text-xs font-semibold text-cyan-100 transition duration-300 ease-in-out hover:bg-cyan-400/25 disabled:opacity-60"
      >
        <FolderPlus size={13} /> New Scan
      </button>
    </div>
  );
};

export default ActionPanel;
