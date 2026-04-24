import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Zap, Flame, RefreshCw, BarChart3 } from 'lucide-react';

const ScreenerResultsTable = ({ stocks, onOpenResearch }) => {
  const getSignalIcon = (signal) => {
    switch (signal) {
      case 'BREAKOUT':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'MOMENTUM':
        return <Zap className="w-4 h-4 text-cyan-400" />;
      case 'PULLBACK':
        return <RefreshCw className="w-4 h-4 text-blue-400" />;
      default:
        return <BarChart3 className="w-4 h-4 text-slate-400" />;
    }
  };

  const getSentimentColor = (sentiment) => {
    if (sentiment > 50) return 'text-emerald-400 bg-emerald-500/10';
    if (sentiment > 0) return 'text-green-400 bg-green-500/10';
    if (sentiment > -50) return 'text-orange-400 bg-orange-500/10';
    return 'text-rose-400 bg-rose-500/10';
  };

  const getTrendBadgeColor = (trend) => {
    if (trend === 'bullish') return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
    if (trend === 'bearish') return 'bg-rose-500/20 text-rose-300 border-rose-400/30';
    return 'bg-slate-500/20 text-slate-300 border-slate-400/30';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="bg-slate-800/50 sticky top-0 z-10">
          <tr className="border-b border-slate-700">
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
              Symbol
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
              Price
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
              Change %
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
              Research Signal
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
              RSI
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
              P/E
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
              Trend
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
              Sentiment
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
              Sector
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
              Research
            </th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock, index) => (
            <motion.tr
              key={stock.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
            >
              {}
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-cyan-300">{stock.symbol}</p>
                    <p className="text-xs text-slate-400">{stock.name}</p>
                  </div>
                </div>
              </td>

              {}
              <td className="px-6 py-4">
                <p className="text-sm font-bold text-white">â‚¹{stock.price.toFixed(2)}</p>
              </td>

              {}
              <td className="px-6 py-4">
                <div
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                    stock.change >= 0
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-rose-400 bg-rose-500/10'
                  }`}
                >
                  {stock.change >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                </div>
              </td>

              {}
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  {getSignalIcon(stock.signal)}
                  <span className="text-xs font-semibold text-slate-300">{stock.signal}</span>
                </div>
              </td>

              {}
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        stock.rsi > 70
                          ? 'bg-rose-500'
                          : stock.rsi < 30
                            ? 'bg-emerald-500'
                            : 'bg-cyan-500'
                      }`}
                      style={{ width: `${stock.rsi}%` }}
                    />
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      stock.rsi > 70
                        ? 'text-rose-400'
                        : stock.rsi < 30
                          ? 'text-emerald-400'
                          : 'text-cyan-300'
                    }`}
                  >
                    {stock.rsi.toFixed(0)}
                  </span>
                </div>
              </td>

              {}
              <td className="px-6 py-4">
                <p className="text-sm text-slate-300">{stock.pe.toFixed(1)}</p>
              </td>

              {}
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getTrendBadgeColor(
                    stock.trend
                  )}`}
                >
                  {stock.trend === 'bullish' ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {stock.trend.charAt(0).toUpperCase() + stock.trend.slice(1)}
                </span>
              </td>

              {}
              <td className="px-6 py-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getSentimentColor(
                    stock.sentiment
                  )}`}
                >
                  {stock.sentiment > 0 ? '+' : ''}{stock.sentiment}
                </span>
              </td>

              {}
              <td className="px-6 py-4">
                <span className="inline-block px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs font-medium">
                  {stock.sector}
                </span>
              </td>

              {}
              <td className="px-6 py-4">
                <button
                  onClick={() => onOpenResearch?.(stock.symbol)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/30"
                >
                  Open Research
                </button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScreenerResultsTable;
