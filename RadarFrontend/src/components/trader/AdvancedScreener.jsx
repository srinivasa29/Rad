import React, { useState, useEffect } from "react";
import { Filter, Search, SlidersHorizontal, ArrowDown, ArrowUp } from "lucide-react";
import { runScreenerScan } from "../../api/screenerApi";

const PRESETS = [
  { id: "custom", label: "Custom Scan" },
  { id: "momentum", label: "Momentum Movers" },
  { id: "value", label: "Value Picks" },
  { id: "breakout", label: "High RSI Breakouts" },
];

const AdvancedScreener = () => {
  const [activePreset, setActivePreset] = useState("custom");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const [filters, setFilters] = useState({
    minPrice: "", maxPrice: "",
    minChange: "", maxChange: "",
    minPe: "", maxPe: "",
    minMarketCap: "", maxMarketCap: "",
    minRsi: "", maxRsi: "",
    minScore: "", maxScore: "",
    volumeStatus: "",
  });

  const [sortBy, setSortBy] = useState("score");
  const [sortOrder, setSortOrder] = useState("desc");

  const executeScan = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const payload = {
        preset: activePreset !== "custom" ? activePreset : undefined,
        limit: 50,
        strictLive: false,
        sortBy,
        sortOrder
      };

      if (activePreset === "custom") {
        const cleanFilters = Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== "")
        );
        payload.filters = cleanFilters;
      }

      const response = await runScreenerScan(payload);
      if (response && response.success) {
        setResults(response.data.results || []);
      } else {
        setResults([]);
        setHasError(true);
      }
    } catch (error) {
      console.error("Screener scan failed:", error);
      setResults([]);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    executeScan();
  }, [activePreset, sortBy, sortOrder]);

  const handleFilterChange = (e) => {
    setActivePreset("custom");
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const formatMarketCap = (cap) => {
    if (!cap) return "--";
    return cap;
  };

  return (
    <div className="trader-card flex flex-col h-full bg-transparent border border-white/10 overflow-hidden relative" style={{ minHeight: "400px" }}>
      {isLoading && (
        <div className="absolute inset-0 bg-[#0b0f17]/70 backdrop-blur-sm z-20 flex items-center justify-center text-[11px] font-mono text-[#42C0A5] uppercase tracking-wider">
          <div className="w-4 h-4 rounded-full border-2 border-[#42C0A5] border-t-transparent animate-spin mr-2"></div>
          Scanning Market Universe...
        </div>
      )}
      
      <div className="card-header flex justify-between items-center mb-0 px-3 py-2 bg-gradient-to-r from-[#1a1e2e] to-[#131722] border-b border-white/10">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[#42C0A5]" />
          <h3 className="text-[#e2e8f0] font-bold text-sm tracking-wider uppercase">Advanced Stock Screener</h3>
        </div>
        <div className="flex gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setActivePreset(preset.id)}
              className={`px-3 py-1 text-[11px] font-bold tracking-wide rounded transition-all flex items-center gap-1 ${
                activePreset === preset.id
                  ? "bg-[#42C0A5]/20 text-[#42C0A5] border border-[#42C0A5]/30"
                  : "bg-white/5 text-[#8b909a] border border-white/10 hover:text-white hover:bg-white/10"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row p-0">
        {/* Filters Sidebar */}
        <div className="w-full xl:w-64 border-r border-white/10 bg-[#131722]/50 p-3 h-full overflow-y-auto custom-scrollbar flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-[#9194a2] font-semibold uppercase tracking-wider flex items-center gap-1">
              <SlidersHorizontal size={12} /> Custom Filters
            </span>
            <button
              onClick={() => {
                setFilters({
                  minPrice: "", maxPrice: "", minChange: "", maxChange: "",
                  minPe: "", maxPe: "", minMarketCap: "", maxMarketCap: "",
                  minRsi: "", maxRsi: "", minScore: "", maxScore: "", volumeStatus: "",
                });
                setActivePreset("custom");
              }}
              className="text-[10px] text-[#5d606b] hover:text-white hover:underline transition-colors"
            >
              CLEAR
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#7f8591] font-semibold uppercase tracking-wider">Technical Score</label>
              <div className="flex gap-2">
                <input type="number" name="minScore" value={filters.minScore} onChange={handleFilterChange} placeholder="Min" className="w-1/2 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-[#42C0A5]/50 transition-colors" />
                <input type="number" name="maxScore" value={filters.maxScore} onChange={handleFilterChange} placeholder="Max" className="w-1/2 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-[#42C0A5]/50 transition-colors" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-[#7f8591] font-semibold uppercase tracking-wider">RSI (14)</label>
              <div className="flex gap-2">
                <input type="number" name="minRsi" value={filters.minRsi} onChange={handleFilterChange} placeholder="Min" className="w-1/2 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-[#42C0A5]/50 transition-colors" />
                <input type="number" name="maxRsi" value={filters.maxRsi} onChange={handleFilterChange} placeholder="Max" className="w-1/2 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-[#42C0A5]/50 transition-colors" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-[#7f8591] font-semibold uppercase tracking-wider">Change %</label>
              <div className="flex gap-2">
                <input type="number" name="minChange" value={filters.minChange} onChange={handleFilterChange} placeholder="Min %" className="w-1/2 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-[#42C0A5]/50 transition-colors" />
                <input type="number" name="maxChange" value={filters.maxChange} onChange={handleFilterChange} placeholder="Max %" className="w-1/2 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-[#42C0A5]/50 transition-colors" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-[#7f8591] font-semibold uppercase tracking-wider">P/E Ratio</label>
              <div className="flex gap-2">
                <input type="number" name="minPe" value={filters.minPe} onChange={handleFilterChange} placeholder="Min" className="w-1/2 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-[#42C0A5]/50 transition-colors" />
                <input type="number" name="maxPe" value={filters.maxPe} onChange={handleFilterChange} placeholder="Max" className="w-1/2 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-[#42C0A5]/50 transition-colors" />
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={executeScan}
                className="w-full bg-gradient-to-r from-[#42C0A5] to-[#36a68f] text-black font-bold text-xs py-2.5 rounded hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
              >
                <Search size={14} /> RUN SCAN
              </button>
            </div>
          </div>
        </div>

        {/* Results Data Grid */}
        <div className="flex-1 overflow-x-auto relative">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="sticky top-0 z-10 bg-[#161b22] border-b border-white/10">
              <tr>
                {[{ key: "symbol", label: "Symbol" },
                  { key: "price", label: "Price" },
                  { key: "change", label: "Change %" },
                  { key: "rsi", label: "RSI" },
                  { key: "score", label: "Score" },
                  { key: "bias", label: "Bias" },
                  { key: "pe", label: "P/E" },
                  { key: "sector", label: "Sector" }
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="p-3 text-[10px] text-[#8b909a] font-bold uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap select-none"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortBy === col.key && (
                        sortOrder === "desc" ? <ArrowDown size={10} className="text-[#42C0A5]" /> : <ArrowUp size={10} className="text-[#42C0A5]" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#0b0f17]/30">
              {!isLoading && hasError && (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-xs font-mono text-[#f0b429] uppercase tracking-wider">
                    Error loading screener results. Check backend connection.
                  </td>
                </tr>
              )}
              {!isLoading && !hasError && results.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-xs font-mono text-[#5d606b] uppercase tracking-wider">
                    No stocks match the selected criteria.
                  </td>
                </tr>
              )}
              {results.map((row, idx) => (
                <tr key={`${row.symbol}-${idx}`} className="hover:bg-white/5 transition-colors">
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#e2e8f0] text-[13px]">{row.displaySymbol}</span>
                      <span className="text-[9px] text-[#717789] truncate max-w-[120px]">{row.name}</span>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-xs text-[#cfd3df]">
                    {row.price !== null ? row.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "--"}
                  </td>
                  <td className="p-3 font-mono text-xs font-bold">
                    {row.change !== null ? (
                      <span className={row.change > 0 ? "text-[#42C0A5]" : row.change < 0 ? "text-[#ed5750]" : "text-[#8b909a]"}>
                        {row.change > 0 ? '+' : ''}{row.change.toFixed(2)}%
                      </span>
                    ) : "--"}
                  </td>
                  <td className="p-3 font-mono text-xs">
                    {row.rsi !== null ? (
                      <span className={row.rsi >= 70 ? "text-[#ed5750]" : row.rsi <= 30 ? "text-[#42C0A5]" : "text-[#cfd3df]"}>
                        {row.rsi.toFixed(1)}
                      </span>
                    ) : "--"}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                       <span className="font-mono text-xs text-white">{row.score !== null ? row.score : "--"}</span>
                       {row.score !== null && (
                         <div className="w-12 h-1.5 bg-black/40 rounded-full overflow-hidden">
                           <div className="h-full rounded-full bg-gradient-to-r from-[#ed5750] via-yellow-400 to-[#42C0A5]"
                                style={{ width: `${Math.max(0, Math.min(100, row.score))}%` }}>
                           </div>
                         </div>
                       )}
                    </div>
                  </td>
                  <td className="p-3 text-[10px] font-bold tracking-wider">
                    {row.bias ? (
                      <span className={`px-2 py-0.5 rounded ${
                        row.bias === 'bullish' ? 'bg-[#42C0A5]/10 text-[#42C0A5] border border-[#42C0A5]/20' : 
                        row.bias === 'bearish' ? 'bg-[#ed5750]/10 text-[#ed5750] border border-[#ed5750]/20' : 
                        'bg-white/5 text-[#8b909a] border border-white/10'
                      }`}>
                        {row.bias.toUpperCase()}
                      </span>
                    ) : "--"}
                  </td>
                  <td className="p-3 font-mono text-xs text-[#a6abba]">
                    {row.pe !== null ? row.pe.toFixed(2) : "--"}
                  </td>
                  <td className="p-3 text-[10px] uppercase text-[#717789] tracking-wider truncate max-w-[100px]">
                    {row.sector || "--"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdvancedScreener;
