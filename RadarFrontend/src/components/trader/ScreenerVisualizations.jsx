import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Newspaper } from 'lucide-react';


export const ScreenerHeatmap = ({ results, metric = 'change', onStockClick }) => {
  const getColor = (value, metric) => {
    switch (metric) {
      case 'change':
        if (value > 3) return 'bg-emerald-600 border-emerald-500';
        if (value > 1) return 'bg-emerald-500 border-emerald-400';
        if (value > 0) return 'bg-green-500 border-green-400';
        if (value > -1) return 'bg-yellow-500 border-yellow-400';
        if (value > -3) return 'bg-orange-500 border-orange-400';
        return 'bg-rose-600 border-rose-500';
      
      case 'rsi':
        if (value > 70) return 'bg-rose-600 border-rose-500';
        if (value > 60) return 'bg-orange-500 border-orange-400';
        if (value > 40) return 'bg-yellow-500 border-yellow-400';
        if (value > 30) return 'bg-green-500 border-green-400';
        return 'bg-emerald-600 border-emerald-500';
      
      case 'score':
        if (value > 80) return 'bg-emerald-600 border-emerald-500';
        if (value > 65) return 'bg-emerald-500 border-emerald-400';
        if (value > 50) return 'bg-yellow-500 border-yellow-400';
        if (value > 35) return 'bg-orange-500 border-orange-400';
        return 'bg-rose-600 border-rose-500';
      
      case 'sentiment':
        if (value > 50) return 'bg-emerald-600 border-emerald-500';
        if (value > 20) return 'bg-green-500 border-green-400';
        if (value > -20) return 'bg-yellow-500 border-yellow-400';
        if (value > -50) return 'bg-orange-500 border-orange-400';
        return 'bg-rose-600 border-rose-500';
      
      default:
        return 'bg-slate-700 border-slate-600';
    }
  };

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => (b[metric] || 0) - (a[metric] || 0));
  }, [results, metric]);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Market Heatmap</h3>
          <p className="text-sm text-slate-400">Color intensity represents {metric} values</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Legend:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-emerald-600 rounded" />
            <span className="text-xs text-slate-400">High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-yellow-500 rounded" />
            <span className="text-xs text-slate-400">Mid</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-rose-600 rounded" />
            <span className="text-xs text-slate-400">Low</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {sortedResults.map((stock, index) => {
          const value = stock[metric] || 0;
          const colorClass = getColor(value, metric);

          return (
            <motion.button
              key={stock.symbol}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              whileHover={{ scale: 1.05, zIndex: 10 }}
              onClick={() => onStockClick?.(stock)}
              className={`group relative p-4 rounded-xl border-2 transition-all hover:shadow-lg ${colorClass}`}
            >
              <div className="text-left">
                <div className="font-mono font-bold text-white text-sm mb-1">{stock.symbol}</div>
                <div className="text-xs text-white/90 font-semibold">
                  {metric === 'change' && `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`}
                  {metric === 'rsi' && `RSI ${value.toFixed(0)}`}
                  {metric === 'score' && `Score ${value}`}
                  {metric === 'sentiment' && `${value >= 0 ? '+' : ''}${value}`}
                  {metric === 'pe' && `P/E ${value?.toFixed(1) || 'N/A'}`}
                </div>
                {stock.newsCount > 0 && (
                  <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
                    <Newspaper className="w-2.5 h-2.5 text-white" />
                    <span className="text-[10px] font-bold text-white">{stock.newsCount}</span>
                  </div>
                )}
              </div>

              {}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                <div className="px-3 py-2 rounded-lg bg-slate-900/95 border border-slate-700 shadow-xl whitespace-nowrap">
                  <div className="text-xs font-bold text-white mb-1">{stock.name}</div>
                  <div className="space-y-0.5 text-[10px]">
                    <div className="text-slate-300">Price: â‚¹{stock.price?.toFixed(2)}</div>
                    <div className={stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      Change: {stock.change >= 0 ? '+' : ''}{stock.change?.toFixed(2)}%
                    </div>
                    <div className="text-slate-300">RSI: {stock.rsi?.toFixed(1)}</div>
                    <div className="text-slate-300">Score: {stock.score}</div>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};


export const StockComparison = ({ stocks, onRemove }) => {
  if (!stocks || stocks.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-slate-400 text-lg">Select stocks to compare (max 4)</p>
        <p className="text-slate-500 text-sm mt-2">Click checkboxes in the results table</p>
      </div>
    );
  }

  const metrics = [
    { key: 'price', label: 'Price', format: (v) => `â‚¹${v?.toFixed(2) || 'N/A'}` },
    { key: 'change', label: 'Change %', format: (v) => `${v >= 0 ? '+' : ''}${v?.toFixed(2)}%`, colored: true },
    { key: 'rsi', label: 'RSI', format: (v) => v?.toFixed(1) || 'N/A' },
    { key: 'score', label: 'Score', format: (v) => v || 'N/A' },
    { key: 'pe', label: 'P/E Ratio', format: (v) => v?.toFixed(2) || 'N/A' },
    { key: 'marketCap', label: 'Market Cap', format: (v) => v || 'N/A' },
    { key: 'sector', label: 'Sector', format: (v) => v || 'N/A' },
    { key: 'bias', label: 'Bias', format: (v) => v || 'N/A', badge: true },
    { key: 'newsCount', label: 'News Count', format: (v) => v || 0 },
    { key: 'sentiment', label: 'Sentiment', format: (v) => `${v >= 0 ? '+' : ''}${v || 0}`, colored: true },
  ];

  const getBiasColor = (bias) => {
    if (bias === 'bullish') return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
    if (bias === 'bearish') return 'bg-rose-500/20 text-rose-300 border-rose-400/30';
    return 'bg-slate-500/20 text-slate-300 border-slate-400/30';
  };

  return (
    <div className="p-6 overflow-x-auto">
      <h3 className="text-xl font-bold text-white mb-6">Stock Comparison ({stocks.length} selected)</h3>
      
      <div className="min-w-[800px]">
        <div className="grid gap-4" style={{ gridTemplateColumns: `180px repeat(${stocks.length}, 1fr)` }}>
          {}
          <div className="font-semibold text-slate-400 text-sm py-3">Metric</div>
          {stocks.map(stock => (
            <div key={stock.symbol} className="relative p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <button
                onClick={() => onRemove(stock.symbol)}
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
              >
                Ã—
              </button>
              <div className="font-mono font-bold text-cyan-300 text-lg mb-1">{stock.symbol}</div>
              <div className="text-xs text-slate-400 truncate">{stock.name}</div>
            </div>
          ))}

          {}
          {metrics.map(metric => (
            <React.Fragment key={metric.key}>
              <div className="flex items-center py-3 text-sm text-slate-300 font-medium border-t border-slate-800">
                {metric.label}
              </div>
              {stocks.map(stock => {
                const value = stock[metric.key];
                return (
                  <div key={stock.symbol} className="flex items-center py-3 border-t border-slate-800">
                    {metric.badge ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getBiasColor(value)}`}>
                        {metric.format(value)}
                      </span>
                    ) : (
                      <span className={`text-sm font-semibold ${
                        metric.colored && value
                          ? value >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          : 'text-white'
                      }`}>
                        {metric.format(value)}
                      </span>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {}
        <div className="mt-8 space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-slate-400 mb-3">Performance Comparison</h4>
            <div className="grid gap-3" style={{ gridTemplateColumns: `180px repeat(${stocks.length}, 1fr)` }}>
              <div className="text-sm text-slate-400">Change %</div>
              {stocks.map(stock => {
                const value = stock.change || 0;
                const maxAbs = Math.max(...stocks.map(s => Math.abs(s.change || 0)));
                const width = Math.abs(value) / maxAbs * 100;
                return (
                  <div key={stock.symbol} className="flex items-center gap-2">
                    <div className="flex-1 h-8 bg-slate-800 rounded-lg overflow-hidden relative">
                      <div
                        className={`h-full ${value >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${width}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{value >= 0 ? '+' : ''}{value.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-400 mb-3">Technical Score</h4>
            <div className="grid gap-3" style={{ gridTemplateColumns: `180px repeat(${stocks.length}, 1fr)` }}>
              <div className="text-sm text-slate-400">Score (0-100)</div>
              {stocks.map(stock => {
                const value = stock.score || 0;
                return (
                  <div key={stock.symbol} className="flex items-center gap-2">
                    <div className="flex-1 h-8 bg-slate-800 rounded-lg overflow-hidden relative">
                      <div
                        className={`h-full ${value >= 65 ? 'bg-emerald-500' : value >= 40 ? 'bg-yellow-500' : 'bg-rose-500'}`}
                        style={{ width: `${value}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{value}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default { ScreenerHeatmap, StockComparison };
