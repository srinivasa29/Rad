import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Flame,
  RefreshCw,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const ScreenerStockCard = ({ stock, isSelected, onSelect, onOpenResearch, index }) => {
  const isPositive = stock.change >= 0;
  const trendColor = stock.trend === 'bullish' ? 'emerald' : stock.trend === 'bearish' ? 'rose' : 'slate';
  const signalColor =
    stock.signal === 'BREAKOUT'
      ? 'amber'
      : stock.signal === 'MOMENTUM'
        ? 'cyan'
        : stock.signal === 'PULLBACK'
          ? 'blue'
          : 'slate';

  const signalClassMap = {
    amber: {
      selected: 'border-amber-500 shadow-lg shadow-amber-500/30',
      hover: 'hover:border-slate-600 hover:shadow-lg hover:shadow-slate-900/50',
      hoverGlow: 'from-amber-400',
      checkbox: 'bg-amber-500 border-amber-400',
      badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      signalText: 'text-amber-300',
      progress: 'from-amber-400 to-amber-500',
      hoverBorder: 'group-hover:border-amber-500/50',
    },
    cyan: {
      selected: 'border-cyan-500 shadow-lg shadow-cyan-500/30',
      hover: 'hover:border-slate-600 hover:shadow-lg hover:shadow-slate-900/50',
      hoverGlow: 'from-cyan-400',
      checkbox: 'bg-cyan-500 border-cyan-400',
      badge: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
      signalText: 'text-cyan-300',
      progress: 'from-cyan-400 to-cyan-500',
      hoverBorder: 'group-hover:border-cyan-500/50',
    },
    blue: {
      selected: 'border-blue-500 shadow-lg shadow-blue-500/30',
      hover: 'hover:border-slate-600 hover:shadow-lg hover:shadow-slate-900/50',
      hoverGlow: 'from-blue-400',
      checkbox: 'bg-blue-500 border-blue-400',
      badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      signalText: 'text-blue-300',
      progress: 'from-blue-400 to-blue-500',
      hoverBorder: 'group-hover:border-blue-500/50',
    },
    slate: {
      selected: 'border-slate-500 shadow-lg shadow-slate-500/30',
      hover: 'hover:border-slate-600 hover:shadow-lg hover:shadow-slate-900/50',
      hoverGlow: 'from-slate-400',
      checkbox: 'bg-slate-500 border-slate-400',
      badge: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
      signalText: 'text-slate-300',
      progress: 'from-slate-400 to-slate-500',
      hoverBorder: 'group-hover:border-slate-500/50',
    },
  };
  const signalClasses = signalClassMap[signalColor] || signalClassMap.slate;

  const trendLabelMap = {
    bullish: 'BULLISH',
    bearish: 'BEARISH',
    neutral: 'NEUTRAL',
  };
  const trendTextClass = trendColor === 'emerald' ? 'text-emerald-400' : trendColor === 'rose' ? 'text-rose-400' : 'text-slate-400';

  const chartData = useMemo(
    () =>
      stock.chart.map((price) => ({
        price,
      })),
    [stock.chart]
  );

  const getSignalIcon = () => {
    switch (stock.signal) {
      case 'BREAKOUT':
        return <Flame className="w-4 h-4" />;
      case 'MOMENTUM':
        return <Zap className="w-4 h-4" />;
      case 'PULLBACK':
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getTrendIcon = () => {
    return stock.trend === 'bullish' ? (
      <TrendingUp className="w-4 h-4" />
    ) : (
      <TrendingDown className="w-4 h-4" />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group relative bg-gradient-to-br from-slate-800 to-slate-900 border rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
        isSelected
          ? signalClasses.selected
          : `border-slate-700 ${signalClasses.hover}`
      }`}
      onClick={onSelect}
    >
      {}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${signalClasses.hoverGlow} to-transparent pointer-events-none`}
      />

      {}
      <div className="absolute top-3 right-3 z-10">
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            isSelected
              ? signalClasses.checkbox
              : 'border-slate-600 hover:border-slate-400'
          }`}
        >
          {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
        </div>
      </div>

      <div className="p-4 relative z-1">
        {}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">{stock.symbol}</h3>
              <span
                className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${signalClasses.badge}`}
              >
                {getSignalIcon()}
                {stock.signal}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{stock.name}</p>
          </div>
        </div>

        {}
        <div className="mb-4 pb-4 border-b border-slate-700/50">
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-3xl font-bold text-white">â‚¹{stock.price.toFixed(2)}</div>
            <div
              className={`flex items-center gap-1 text-lg font-bold ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              {isPositive ? '+' : ''}{stock.change.toFixed(2)}%
            </div>
          </div>
          <p className="text-xs text-slate-500">
            <span className={`${trendTextClass} font-semibold`}>
              {trendLabelMap[stock.trend] || 'NEUTRAL'}
            </span>
          </p>
        </div>

        {}
        <div className="mb-4 h-12 -mx-4 px-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="price"
                stroke={isPositive ? '#10b981' : '#ef4444'}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {}
        <div className="mb-4 pb-4 border-b border-slate-700/50">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-slate-500 uppercase tracking-wide">Entry</p>
              <p className="text-slate-100 font-semibold">â‚¹{Number(stock.entry || stock.price).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-slate-500 uppercase tracking-wide">Target</p>
              <p className="text-slate-100 font-semibold">â‚¹{Number(stock.target || stock.price).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-slate-500 uppercase tracking-wide">Stop Loss</p>
              <p className="text-slate-100 font-semibold">â‚¹{Number(stock.stopLoss || stock.price).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {}
        <div className="mb-4 pb-4 border-b border-slate-700/50">
          <p className="text-xs text-slate-400 mb-1">Research Signal</p>
          <p className="text-xs text-slate-200">{stock.signalType}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${signalClasses.progress}`}
                style={{
                  width:
                    stock.signalStrength === 'Strong'
                      ? '100%'
                      : stock.signalStrength === 'Medium'
                        ? '65%'
                        : '40%',
                }}
              />
            </div>
            <span
              className={`text-xs font-semibold ${signalClasses.signalText} whitespace-nowrap`}
            >
              {stock.signalStrength}
            </span>
          </div>
        </div>

        {}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {}
          <div className="bg-slate-900/50 rounded p-2 border border-slate-700/30">
            <p className="text-xs text-slate-400 mb-1">RSI</p>
            <p className={`text-sm font-bold ${
              stock.rsi > 70
                ? 'text-rose-400'
                : stock.rsi < 30
                  ? 'text-emerald-400'
                  : 'text-slate-300'
            }`}>
              {stock.rsi.toFixed(0)}
            </p>
          </div>

          {}
          <div className="bg-slate-900/50 rounded p-2 border border-slate-700/30">
            <p className="text-xs text-slate-400 mb-1">P/E Ratio</p>
            <p className="text-sm font-bold text-slate-300">{stock.pe.toFixed(1)}</p>
          </div>

          {}
          <div className="bg-slate-900/50 rounded p-2 border border-slate-700/30">
            <p className="text-xs text-slate-400 mb-1">Sentiment</p>
            <p className={`text-sm font-bold ${
              stock.sentiment > 50
                ? 'text-emerald-400'
                : stock.sentiment < -50
                  ? 'text-rose-400'
                  : 'text-slate-300'
            }`}>
              {stock.sentiment > 0 ? '+' : ''}{stock.sentiment}
            </p>
          </div>

          {}
          <div className="bg-slate-900/50 rounded p-2 border border-slate-700/30">
            <p className="text-xs text-slate-400 mb-1">Research Score</p>
            <p className="text-sm font-bold text-cyan-300">{stock.strength}</p>
          </div>
        </div>

        {}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span>Volume: {(stock.volume / 1000000).toFixed(1)}M</span>
          <span className="px-2 py-1 bg-slate-700/50 rounded">{stock.sector}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span>RVOL {Number(stock.rvol || 1).toFixed(1)}x</span>
          <span className="text-cyan-300 font-semibold">{stock.strength}</span>
        </div>

        {}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenResearch?.(stock.symbol);
          }}
          className="w-full py-2 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 border border-cyan-500/30"
        >
          <BarChart3 className="w-4 h-4" />
          View Details
        </button>
      </div>

      {}
      <div
        className={`absolute inset-0 rounded-xl border border-transparent ${signalClasses.hoverBorder} transition-colors pointer-events-none`}
      />
    </motion.div>
  );
};

export default ScreenerStockCard;
