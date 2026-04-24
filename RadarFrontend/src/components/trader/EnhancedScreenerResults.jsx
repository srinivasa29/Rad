import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Newspaper,
  Bell,
  Save,
  Download,
  BarChart3,
  Grid3x3,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';


export const EnhancedScreenerResults = ({
  results,
  loading,
  onSort,
  sortBy,
  sortOrder,
  onCompare,
  selectedForComparison,
  showNews = true,
}) => {
  const [hoveredStock, setHoveredStock] = useState(null);

  const getSentimentColor = (sentiment) => {
    if (sentiment >= 50) return 'text-emerald-400 bg-emerald-500/20';
    if (sentiment >= 20) return 'text-green-400 bg-green-500/20';
    if (sentiment >= -20) return 'text-yellow-400 bg-yellow-500/20';
    if (sentiment >= -50) return 'text-orange-400 bg-orange-500/20';
    return 'text-rose-400 bg-rose-500/20';
  };

  const getBiasColor = (bias) => {
    if (bias === 'bullish') return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
    if (bias === 'bearish') return 'bg-rose-500/20 text-rose-300 border-rose-400/30';
    return 'bg-slate-500/20 text-slate-300 border-slate-400/30';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400">Scanning market universe...</p>
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-lg">No stocks match the selected criteria</p>
          <p className="text-slate-500 text-sm mt-2">Try adjusting your filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
          <tr className="border-b border-slate-700">
            <th className="px-4 py-3 text-left">
              <input
                type="checkbox"
                className="w-4 h-4 rounded bg-slate-700 border-slate-600"
                onChange={(e) => {
                  if (e.target.checked) {
                    results.forEach(r => onCompare(r.symbol, true));
                  } else {
                    results.forEach(r => onCompare(r.symbol, false));
                  }
                }}
              />
            </th>
            <SortableHeader label="Symbol" field="symbol" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
            <SortableHeader label="Name" field="name" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
            <SortableHeader label="Price" field="price" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
            <SortableHeader label="Change %" field="change" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
            <SortableHeader label="RSI" field="rsi" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
            <SortableHeader label="Score" field="score" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Bias</th>
            <SortableHeader label="P/E" field="pe" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Sector</th>
            {showNews && (
              <>
                <SortableHeader label="News" field="newsCount" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
                <SortableHeader label="Sentiment" field="sentiment" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              </>
            )}
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {results.map((stock, index) => (
            <motion.tr
              key={stock.symbol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              onMouseEnter={() => setHoveredStock(stock.symbol)}
              onMouseLeave={() => setHoveredStock(null)}
              className={`border-b border-slate-800/50 hover:bg-cyan-500/5 transition-colors ${
                selectedForComparison?.includes(stock.symbol) ? 'bg-cyan-500/10' : ''
              }`}
            >
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedForComparison?.includes(stock.symbol)}
                  onChange={(e) => onCompare(stock.symbol, e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-700 border-slate-600"
                />
              </td>
              <td className="px-4 py-3">
                <div className="font-mono font-bold text-cyan-300">{stock.symbol}</div>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm text-slate-300 max-w-[200px] truncate">{stock.name}</div>
              </td>
              <td className="px-4 py-3">
                <div className="font-semibold text-white">â‚¹{stock.price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </td>
              <td className="px-4 py-3">
                <div className={`flex items-center gap-1 ${stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stock.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="font-semibold">{stock.change >= 0 ? '+' : ''}{stock.change?.toFixed(2)}%</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className={`text-sm font-medium ${
                  stock.rsi > 70 ? 'text-rose-400' : stock.rsi < 30 ? 'text-emerald-400' : 'text-slate-300'
                }`}>
                  {stock.rsi?.toFixed(1)}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stock.score >= 65 ? 'bg-emerald-500' : stock.score >= 40 ? 'bg-yellow-500' : 'bg-rose-500'}`}
                      style={{ width: `${stock.score}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-300 w-8">{stock.score}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getBiasColor(stock.bias)}`}>
                  {stock.bias}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm text-slate-300">{stock.pe?.toFixed(2) || 'N/A'}</div>
              </td>
              <td className="px-4 py-3">
                <div className="text-xs text-slate-400">{stock.sector || 'N/A'}</div>
              </td>
              {showNews && (
                <>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {stock.newsCount > 0 ? (
                        <>
                          <Newspaper className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-sm font-semibold text-cyan-300">{stock.newsCount}</span>
                          {stock.hasBreakingNews && (
                            <span className="ml-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-slate-500">0</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {stock.sentiment !== undefined && stock.sentiment !== null ? (
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getSentimentColor(stock.sentiment)}`}>
                        {stock.sentiment > 0 ? '+' : ''}{stock.sentiment}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">N/A</span>
                    )}
                  </td>
                </>
              )}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                    title="View Details"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1.5 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors"
                    title="Add Alert"
                  >
                    <Bell className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SortableHeader = ({ label, field, sortBy, sortOrder, onSort }) => {
  const isActive = sortBy === field;
  
  return (
    <th
      onClick={() => onSort(field)}
      className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase cursor-pointer hover:text-cyan-300 transition-colors"
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {isActive && (
          sortOrder === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
        )}
      </div>
    </th>
  );
};

export default EnhancedScreenerResults;
