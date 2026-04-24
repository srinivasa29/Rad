import { Download, Plus, Save } from "lucide-react";

export default function Header({ onSave, onExport, onNewScreener }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onSave}
        className="flex items-center gap-2 px-3 py-1.5 rounded bg-white/[0.03] border border-white/5 text-[10px] font-black text-gray-400 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest"
      >
        <Save className="h-3 w-3" />
        Save
      </button>
      <button
        type="button"
        onClick={onExport}
        className="flex items-center gap-2 px-3 py-1.5 rounded bg-white/[0.03] border border-white/5 text-[10px] font-black text-gray-400 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest"
      >
        <Download className="h-3 w-3" />
        Excel
      </button>
      <button
        type="button"
        onClick={onNewScreener}
        className="flex items-center gap-2 px-4 py-1.5 rounded bg-blue-600 text-[10px] font-black text-white hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/40 uppercase tracking-widest"
      >
        <Plus className="h-3 w-3" />
        New Scan
      </button>
    </div>
  );
}
