import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { getLogoUrlForSymbol } from '../../utils/logoHelper';

const ScreenerResultsTable = ({ stocks, onOpenResearch, showAdvanced = false }) => {
  const formatNumber = (value, digits = 2) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed.toFixed(digits) : '—';
  };
  const getSignalMeta = (signal) => {
    const normalized = String(signal || 'NEUTRAL').toUpperCase();
    if (normalized === 'BULLISH') {
      return { icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
        badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
        label: 'Bullish' };
    }
    if (normalized === 'BEARISH') {
      return { icon: <TrendingDown className="w-4 h-4 text-rose-400" />,
        badge: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
        label: 'Bearish' };
    }
    return { icon: <BarChart3 className="w-4 h-4 text-slate-400" />,
      badge: 'bg-slate-500/15 text-slate-300 border-slate-400/30',
      label: 'Neutral' };
  };

  return (
    <div className="screener-table overflow-x-auto">
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
              Signal Bias
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
              RSI
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
              P/E
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
              Score
            </th>
            {showAdvanced && (
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                EMA 20/50/200
              </th>
            )}
            {showAdvanced && (
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                ATR
              </th>
            )}
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
              Volume Status
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
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0 relative border border-slate-700/50">
                    <img 
                      src={getLogoUrlForSymbol(stock.symbol)} 
                      alt={stock.symbol}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                      className="w-full h-full object-contain p-0.5 bg-white"
                    />
                    <div className="w-full h-full bg-gradient-to-tr from-[#00d4ff] to-[#00ff9d] items-center justify-center text-black font-black text-xs hidden">
                      {stock.symbol ? stock.symbol[0] : 'S'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-cyan-300">{stock.symbol}</p>
                    <p className="text-xs text-slate-400">{stock.name}</p>
                  </div>
                </div>
              </td>

              {}
              <td className="px-6 py-4">
                <p className="text-sm font-bold text-white">₹{stock.price.toFixed(2)}</p>
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
                  {getSignalMeta(stock.signal).icon}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getSignalMeta(stock.signal).badge}`}>
                    {getSignalMeta(stock.signal).label}
                  </span>
                </div>
              </td>

              {}
              <td className="px-6 py-4">
                {Number.isFinite(stock.rsi) ? (
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
                ) : (
                  <span className="text-xs text-slate-500">—</span>
                )}
              </td>

              {}
              <td className="px-6 py-4">
                <p className="text-sm text-slate-300">{Number.isFinite(stock.pe) ? stock.pe.toFixed(1) : '—'}</p>
              </td>

              {}
              <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-200 border border-cyan-500/30">
                  {Number.isFinite(stock.score) ? stock.score : (Number.isFinite(stock.confidence) ? stock.confidence : '—')}
                </span>
              </td>

              {showAdvanced && (
                <td className="px-6 py-4">
                  <div className="text-xs text-slate-300 space-y-0.5">
                    <div>EMA20: {formatNumber(stock.ema20)}</div>
                    <div>EMA50: {formatNumber(stock.ema50)}</div>
                    <div>EMA200: {formatNumber(stock.ema200)}</div>
                  </div>
                </td>
              )}

              {showAdvanced && (
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-300">{formatNumber(stock.atr)}</span>
                </td>
              )}

              {}
              <td className="px-6 py-4">
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700/50">
                  {stock.volumeStatus ? String(stock.volumeStatus).replace(/_/g, ' ') : '—'}
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
