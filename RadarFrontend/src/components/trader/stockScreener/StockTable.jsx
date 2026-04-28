import { memo } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Star, Zap } from "lucide-react";
import { SparklineChart } from "./SparklineChart.jsx";

const columns = [
  { key: "symbol", label: "Symbol", align: "left" },
  { key: "price", label: "Price", align: "right" },
  { key: "change", label: "Change %", align: "right" },
  { key: "volume", label: "Volume", align: "right" },
  { key: "rvol", label: "RVOL", align: "right" },
  { key: "atr", label: "Volatility (ATR)", align: "right" },
  { key: "rsi", label: "Strength (RSI)", align: "right" },
  { key: "sparkline", label: "Trend (1H)", align: "left" },
];

const formatPrice = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  return number.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatNumber = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  if (number >= 10000000) return `${(number / 10000000).toFixed(1)}Cr`;
  if (number >= 100000) return `${(number / 100000).toFixed(1)}L`;
  return number.toLocaleString("en-IN");
};

const HeaderCell = ({ column, activeSort, sortOrder, onSort }) => {
  const active = activeSort === column.key;

  return (
    <th
      scope="col"
      onClick={() => onSort(column.key)}
      className={`px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#475569] border-bottom border-white/5 cursor-pointer whitespace-nowrap transition-colors hover:text-white ${
        column.align === "right" ? "text-right" : "text-left"
      }`}
    >
      <div className={`inline-flex items-center gap-1.5 ${column.align === "right" ? "justify-end" : "justify-start"}`}>
        {column.label}
        {active ? (sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : null}
      </div>
    </th>
  );
};

export function StockTable({ rows, sortBy, sortOrder, onSort, watchlistSet, onToggleWatchlist, onRowSelect, selectedSymbol, loadingMore = false }) {
  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="terminal-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <HeaderCell key={column.key} column={column} activeSort={sortBy} sortOrder={sortOrder} onSort={onSort} />
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.02]">
          {rows.map((row, index) => {
            const changeTone = row.change == null ? "text-gray-500" : row.change >= 0 ? "text-[#10b981]" : "text-[#ef4444]";
            const inWatchlist = watchlistSet?.has(row.symbol);
            const selected = selectedSymbol === row.symbol;
            
            const rsiWidth = Math.min(100, Math.max(5, row.rsi || 50));
            const atrWidth = Math.min(100, (row.atrPct || 2) * 20);

            return (
              <motion.tr
                key={`${row.symbol}-${index}`}
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15, delay: index * 0.005 }}
                onClick={() => onRowSelect?.(row.symbol)}
                className={`group cursor-pointer transition-all ${selected ? "bg-blue-500/[0.08]" : "hover:bg-white/[0.015]"}`}
              >
                <td className="px-4 py-3 border-none">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleWatchlist?.(row.symbol);
                      }}
                      className={`transition-colors ${inWatchlist ? "text-amber-400" : "text-gray-700 group-hover:text-gray-500"}`}
                    >
                      <Star className={`h-3.5 w-3.5 ${inWatchlist ? "fill-amber-400" : ""}`} />
                    </button>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-white uppercase tracking-tight">{row.symbol || "--"}</span>
                        {row.change > 4 && <Zap className="h-3 w-3 text-amber-400 fill-amber-400 animate-pulse" />}
                      </div>
                      <span className="text-[9px] text-[#475569] font-bold truncate max-w-[100px] uppercase">{row.name || "--"}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-[13px] font-bold text-gray-100 border-none">₹{formatPrice(row.price)}</td>
                <td className={`px-4 py-3 text-right text-[13px] font-black ${changeTone} border-none`}>{row.change == null ? "--" : `${row.change > 0 ? "+" : ""}${row.change.toFixed(2)}%`}</td>
                <td className="px-4 py-3 text-right text-[12px] text-gray-500 font-bold border-none">{formatNumber(row.volume)}</td>
                <td className="px-4 py-3 text-right text-[12px] font-black text-blue-500/70 border-none">{Number(row.rvol || 0).toFixed(1)}x</td>
                
                {}
                <td className="px-4 py-3 border-none text-right min-w-[120px]">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[12px] text-gray-400 font-bold">₹{Number(row.atr || 0).toFixed(2)}</span>
                    <div className="gauge-container max-w-[60px]">
                      <div className="gauge-fill bg-amber-500/50" style={{ width: `${atrWidth}%` }} />
                    </div>
                  </div>
                </td>

                {}
                <td className="px-4 py-3 border-none text-right min-w-[120px]">
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[12px] font-black ${row.rsi > 70 ? 'text-green-400' : row.rsi < 30 ? 'text-red-400' : 'text-blue-400'}`}>
                      {Math.round(row.rsi || 50)}
                    </span>
                    <div className="gauge-container max-w-[60px]">
                      <div 
                        className={`gauge-fill ${row.rsi > 60 ? 'bg-green-500/50' : row.rsi < 40 ? 'bg-red-500/50' : 'bg-blue-500/50'}`} 
                        style={{ width: `${rsiWidth}%` }} 
                      />
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3 border-none min-w-[110px]">
                  <SparklineChart 
                    data={row.history?.map(p => p.price) || []} 
                    color={row.change >= 0 ? "#10b981" : "#ef4444"} 
                    height={22}
                  />
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default memo(StockTable);
