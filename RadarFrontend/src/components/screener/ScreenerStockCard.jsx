import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import { getLogoUrlForSymbol } from '../../utils/logoHelper';

const generateSparklineData = (change, price) => {
  const points = 12;
  const data = [];
  const startVal = price * (1 - (change / 100));
  const step = (price - startVal) / (points - 1);
  for (let i = 0; i < points; i++) {
    // Add realistic oscillation
    const noise = Math.sin(i * 1.6) * (price * 0.003) * (i === 0 || i === points - 1 ? 0 : 1);
    data.push(startVal + (step * i) + noise);
  }
  return data;
};

const Sparkline = ({ change, price, isPositive }) => {
  const data = React.useMemo(() => generateSparklineData(change, price), [change, price]);
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 110;
  const height = 32;

  const pointsString = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - 3 - ((val - min) / range) * (height - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const strokeColor = isPositive ? '#10b981' : '#f43f5e';
  const areaPoints = `0,${height} ${pointsString} ${width},${height}`;
  const gradientId = `sparkline-grad-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradientId})`} />
      <polyline fill="none" stroke={strokeColor} strokeWidth="1.5" points={pointsString} />
    </svg>
  );
};

const ScreenerStockCard = ({ stock, isSelected, onSelect, onOpenResearch, index, showAdvanced = false }) => {
  const isPositive = stock.change >= 0;
  const bias = String(stock.bias || stock.signal || 'neutral').toLowerCase();
  const signalColor = bias === 'bullish' ? 'emerald' : bias === 'bearish' ? 'rose' : 'slate';
  const formatNumber = (value, digits = 2) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed.toFixed(digits) : '—';
  };

  const signalClassMap = {
    emerald: {
      selected: 'border-emerald-500 shadow-lg shadow-emerald-500/30',
      hover: 'hover:border-slate-600 hover:shadow-lg hover:shadow-slate-900/50',
      hoverGlow: 'from-emerald-400',
      checkbox: 'bg-emerald-500 border-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      signalText: 'text-emerald-300',
      progress: 'from-emerald-400 to-emerald-500',
      hoverBorder: 'group-hover:border-emerald-500/50',
    },
    rose: {
      selected: 'border-rose-500 shadow-lg shadow-rose-500/30',
      hover: 'hover:border-slate-600 hover:shadow-lg hover:shadow-slate-900/50',
      hoverGlow: 'from-rose-400',
      checkbox: 'bg-rose-500 border-rose-400',
      badge: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
      signalText: 'text-rose-300',
      progress: 'from-rose-400 to-rose-500',
      hoverBorder: 'group-hover:border-rose-500/50',
    },
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

  const biasLabel = bias === 'bullish' ? 'BULLISH' : bias === 'bearish' ? 'BEARISH' : 'NEUTRAL';
  const biasTextClass = bias === 'bullish' ? 'text-emerald-400' : bias === 'bearish' ? 'text-rose-400' : 'text-slate-400';
  const confidence = Number.isFinite(stock.confidence)
    ? stock.confidence
    : Number.isFinite(stock.score)
      ? stock.score
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group relative screener-card border rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
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
        <div className="flex items-start justify-between mb-3">
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
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{stock.symbol}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${signalClasses.badge}`}
                >
                  {bias === 'bullish' ? <TrendingUp className="w-4 h-4" /> : bias === 'bearish' ? <TrendingDown className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
                  {biasLabel}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{stock.name}</p>
            </div>
          </div>
        </div>

        {}
        <div className="mb-4 pb-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-3xl font-bold text-white">₹{stock.price.toFixed(2)}</div>
              <div
                className={`flex items-center gap-1 text-sm font-bold mt-1 ${
                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isPositive ? '+' : ''}{stock.change.toFixed(2)}%
              </div>
            </div>
            <div className="h-10 w-28 bg-slate-950/40 rounded border border-slate-800/30 p-1 flex items-center justify-center">
              <Sparkline change={stock.change} price={stock.price} isPositive={isPositive} />
            </div>
          </div>
          <p className="text-xs text-slate-500">
            <span className={`${biasTextClass} font-semibold`}>
              {biasLabel}
            </span>
          </p>
        </div>

        {}
        <div className="mb-4 pb-4 border-b border-slate-700/50">
          <p className="text-xs text-slate-400 mb-1">Signal Summary</p>
          <p className="text-xs text-slate-200">{stock.why || 'Signal derived from live technical screening.'}</p>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${signalClasses.progress}`}
                style={{
                  width: confidence !== null ? `${Math.max(10, Math.min(100, confidence))}%` : '40%',
                }}
              />
            </div>
            <span
              className={`text-xs font-semibold ${signalClasses.signalText} whitespace-nowrap`}
            >
              {confidence !== null ? `Confidence ${Math.round(confidence)}%` : 'Confidence —'}
            </span>
          </div>
        </div>



        {}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span>Market Cap: {stock.marketCap || '—'}</span>
          <span className="px-2 py-1 bg-slate-700/50 rounded">{stock.sector}</span>
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
