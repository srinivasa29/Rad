import React from 'react';
import { Activity, Plus, Search } from 'lucide-react';
import SymbolSearchInput from './SymbolSearchInput';

const WatchlistToolbar = ({
  filterQuery,
  onFilterChange,
  addQuery,
  onAddQueryChange,
  onAddSymbol,
  adding,
  trackedCount,
}) => (
  <div className="flex flex-col gap-3 border-b border-slate-800/80 p-4 lg:flex-row lg:items-center lg:justify-between">
    <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
      <div className="w-full max-w-xs">
        <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">
          Filter watchlist
        </label>
        <label className="flex h-12 items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 transition-all duration-200 focus-within:border-[#00f3ff]/40 focus-within:bg-[#00f3ff]/[0.02] focus-within:shadow-[0_0_12px_rgba(0,243,255,0.08)]">
          <Search size={14} className="shrink-0 text-slate-500" />
          <input
            value={filterQuery}
            onChange={(event) => onFilterChange(event.target.value)}
            placeholder="Filter tracked symbols…"
            className="w-full bg-transparent text-sm text-white border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-none focus-visible:outline-none focus-visible:ring-0 shadow-none placeholder:text-slate-600"
          />
        </label>
      </div>
      <div className="w-full max-w-md flex-1">
        <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">
          Add symbol
        </label>
        <div className="flex gap-2">
          <SymbolSearchInput
            value={addQuery}
            onChange={onAddQueryChange}
            onSelect={(item) => onAddSymbol(item.symbol)}
            onSubmit={(event) => {
              event.preventDefault();
              onAddSymbol(addQuery);
            }}
            adding={adding}
            placeholder="Search to add (TCS, INFY…)"
            className="flex-1"
          />
          <button
            type="button"
            disabled={adding || !addQuery.trim()}
            onClick={() => onAddSymbol(addQuery)}
            className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-[#00f3ff] px-4 text-xs font-black uppercase text-slate-950 hover:brightness-110 disabled:opacity-40 disabled:brightness-100 transition-all shadow-md cursor-pointer"
          >
            <Plus size={15} />
            Add
          </button>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mt-2 lg:mt-0">
      <Activity size={14} className="text-[#00f3ff] animate-pulse" />
      {trackedCount} tracked
    </div>
  </div>
);

export default WatchlistToolbar;
