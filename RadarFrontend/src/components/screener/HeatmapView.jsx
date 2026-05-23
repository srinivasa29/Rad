import React from 'react';
import { motion } from 'framer-motion';

const HeatmapView = ({ stocks, onOpenResearch }) => {
  // Group stocks by sector
  const groupedBySector = React.useMemo(() => {
    const groups = {};
    stocks.forEach((stock) => {
      const sector = stock.sector || 'Other';
      if (!groups[sector]) {
        groups[sector] = [];
      }
      groups[sector].push(stock);
    });
    return groups;
  }, [stocks]);

  const getHeatmapColor = (change) => {
    if (change > 3) return 'bg-emerald-600 text-white';
    if (change > 1.5) return 'bg-emerald-500/80 text-white';
    if (change > 0) return 'bg-emerald-500/40 text-emerald-100 border border-emerald-500/30';
    if (change === 0) return 'bg-slate-800 text-slate-300 border border-slate-700';
    if (change > -1.5) return 'bg-rose-500/40 text-rose-100 border border-rose-500/30';
    if (change > -3) return 'bg-rose-500/80 text-white';
    return 'bg-rose-600 text-white';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Sector Heatmap View</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-emerald-600" />
            <span className="text-slate-400">&gt; +3%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-emerald-500/40" />
            <span className="text-slate-400">Positive</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-slate-800" />
            <span className="text-slate-400">Flat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-rose-500/40" />
            <span className="text-slate-400">Negative</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-rose-600" />
            <span className="text-slate-400">&lt; -3%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.entries(groupedBySector).map(([sector, sectorStocks]) => (
          <motion.div
            key={sector}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/80 flex flex-col"
          >
            <h4 className="text-sm font-bold text-slate-300 mb-3 border-b border-slate-800 pb-2 flex justify-between items-center">
              <span>{sector}</span>
              <span className="text-xs font-normal text-slate-500">{sectorStocks.length} assets</span>
            </h4>
            <div className="grid grid-cols-3 gap-2 flex-1">
              {sectorStocks.map((stock) => (
                <div
                  key={stock.id}
                  onClick={() => onOpenResearch?.(stock.symbol)}
                  className={`group relative rounded-lg p-2.5 flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${getHeatmapColor(stock.change)}`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider block">{stock.symbol}</span>
                  <span className="text-[11px] font-semibold mt-1 block">
                    {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                  </span>
                  
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 p-2 bg-slate-950 text-slate-200 rounded-lg text-[11px] font-medium border border-slate-700 shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 text-left">
                    <p className="font-bold text-white mb-0.5">{stock.name}</p>
                    <p>Price: ₹{stock.price.toFixed(2)}</p>
                    <p>Change: {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%</p>
                    <p>RSI: {stock.rsi ? Math.round(stock.rsi) : '—'}</p>
                    <p>Signal: {stock.signal || 'NEUTRAL'}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HeatmapView;
