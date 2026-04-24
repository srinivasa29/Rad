import { motion } from "framer-motion";
import { Filter, RotateCcw, CheckSquare, Square, Zap, Layers, BarChart } from "lucide-react";

const SECTORS = ["All", "IT", "Banking", "Energy", "Auto", "Pharma", "Metals", "FMCG"];

export default function FiltersPanel({ filters, setFilters, onApply, onReset, isOpen }) {
  if (!isOpen) return null;

  const toggleCheckbox = (field) => {
    setFilters(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        
        {}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="h-3 w-3 text-blue-500" />
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Asset Sectors</label>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {SECTORS.map(s => (
              <button
                key={s}
                onClick={() => setFilters(prev => ({ ...prev, sector: s }))}
                className={`py-1.5 px-2 rounded text-[10px] font-bold transition-all border ${
                  filters.sector === s 
                  ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20" 
                  : "bg-white/[0.03] border-white/5 text-gray-400 hover:bg-white/[0.05]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-amber-500" />
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Intraday Pulsing</label>
          </div>
          <div className="space-y-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-gray-400">Min Gap %</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="0.00"
                  value={filters.gapMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, gapMin: e.target.value }))}
                  className="flex-1 bg-black/40 border border-white/5 rounded px-2 py-1.5 text-[11px] text-white outline-none focus:border-blue-500"
                />
                <div className="flex gap-1">
                  {[1, 3, 5].map(v => (
                    <button 
                      key={v}
                      onClick={() => setFilters(prev => ({ ...prev, gapMin: v }))}
                      className="w-6 h-6 rounded bg-white/5 border border-white/5 text-[9px] font-bold text-gray-500 hover:text-white"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart className="h-3 w-3 text-green-500" />
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">RVOL Threshold</label>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 5].map(v => (
              <button
                key={v}
                onClick={() => setFilters(prev => ({ ...prev, rvol: v }))}
                className={`flex-1 py-1.5 rounded text-[10px] font-bold border transition-all ${
                  Number(filters.rvol) === v
                  ? "bg-green-600/20 border-green-500/50 text-green-400"
                  : "bg-white/[0.03] border-white/5 text-gray-500 hover:bg-white/[0.05]"
                }`}
              >
                {v}x
              </button>
            ))}
          </div>
        </section>

        {}
        <section className="space-y-3">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Trend Overlays</label>
          <div className="space-y-2.5">
            <CheckboxItem
              label="Above SMA 50"
              checked={filters.sma50}
              onToggle={() => toggleCheckbox('sma50')}
            />
            <CheckboxItem
              label="Above SMA 200"
              checked={filters.sma200}
              onToggle={() => toggleCheckbox('sma200')}
            />
            <CheckboxItem
              label="MACD Cross"
              checked={filters.macdCross}
              onToggle={() => toggleCheckbox('macdCross')}
            />
          </div>
        </section>
      </div>

      {}
      <div className="p-4 border-t border-white/[0.03] bg-black/40 flex flex-col gap-2">
        <button
          onClick={onApply}
          className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded text-[11px] font-black text-white shadow-xl shadow-blue-900/20 transition-all uppercase tracking-widest"
        >
          Activate Scan
        </button>
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-widest"
        >
          <RotateCcw size={12} /> Clear Params
        </button>
      </div>
    </div>
  );
}

function CheckboxItem({ label, checked, onToggle }) {
  return (
    <div
      onClick={onToggle}
      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all border ${
        checked ? "bg-blue-500/5 border-blue-500/20" : "bg-transparent border-transparent hover:bg-white/[0.02]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
          checked ? "bg-blue-600 border-blue-500" : "bg-black/40 border-white/10"
        }`}>
          {checked && <CheckSquare className="h-2.5 w-2.5 text-white" />}
        </div>
        <span className={`text-[11px] font-bold ${checked ? "text-white" : "text-gray-500"}`}>
          {label}
        </span>
      </div>
    </div>
  );
}
