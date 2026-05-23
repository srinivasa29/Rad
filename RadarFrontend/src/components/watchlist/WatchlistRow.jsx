import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import useTechnicals from '../../hooks/useTechnicals';

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const compact = (v) => {
  const n = Number(v || 0);
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toFixed(0);
};

const WatchlistRow = ({ row, stock, onSelect, onRemove }) => {
  const item = row || stock || {};
  const { loading: techLoading, error: techError, technicals } = useTechnicals(item.symbol, { timeframe: '1d', limit: 200 });
  const isPositive = Number(item.changePercent || item.percent || 0) >= 0;

  return (
    <motion.div className="grid items-center gap-2" style={{ gridTemplateColumns: 'minmax(220px,2fr) minmax(110px,0.8fr) minmax(100px,0.7fr) minmax(110px,0.8fr) minmax(120px,0.8fr)' }}>
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-black uppercase ${isPositive ? 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200' : 'border-rose-400/35 bg-rose-500/15 text-rose-200'}`}>
          {String(item.symbol || '?').charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-[15px] font-black tracking-tight text-white">{item.symbol}</span>
          </div>
          <div className="mt-0.5 truncate text-xs text-slate-300">{item.name}</div>
        </div>
      </div>

      <div className="text-[15px] font-black leading-none text-white">{formatMoney(item.price || technicals?.lastPrice)}</div>

      <div className={`text-[14px] font-black leading-none ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
        <span className="inline-flex items-center gap-1">
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          { (item.changePercent || item.percent) > 0 ? '+' : ''}{Number(item.changePercent ?? item.percent ?? 0).toFixed(2)}%
        </span>
      </div>

      <div className="text-sm font-semibold text-slate-200">{compact(item.volume)}</div>

      <div className="flex items-center justify-center gap-2">
        {((!item || Object.keys(item).length === 0) && (techLoading || !technicals)) ? (
          <div className="text-xs text-slate-400">loading…</div>
        ) : (
          <div className="text-xs text-slate-200 text-center">
            <div>RSI: <span className="font-black">{item.rsi ?? (technicals?.rsi ? Number(technicals.rsi).toFixed(0) : '—')}</span></div>
            <div>MACD: <span className="font-black">{(item.macd?.value ?? technicals?.macd?.value) != null ? Number(item.macd?.value ?? technicals?.macd?.value).toFixed(2) : '—'}</span></div>
            <div>RVOL: <span className="font-black">{item.rvol ?? technicals?.rvol ?? '—'}x</span></div>
            <div>Trend: <span className="font-black">{item.trend ?? technicals?.trend ?? '—'}</span></div>
            <div>Signal: <span className="font-black">{item.signal ?? (technicals?.signals && technicals.signals.length > 0 ? technicals.signals[0] : '—')}</span></div>
          </div>
        )}

          <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            {(item.alerts || []).slice(0,2).map((a, idx) => (
              <span key={idx} className="text-[11px] px-2 py-1 rounded-full bg-white/6 text-gray-100 mr-1">{a}</span>
            ))}
            {item.signal && <span className="text-[11px] px-2 py-1 rounded-full bg-cyan-700/18 text-cyan-200">{item.signal}</span>}
          </div>
          <button type="button" onClick={() => onSelect?.(item)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 text-sm font-semibold text-slate-200 hover:border-cyan-400/30">
            <ChevronRight size={15} />
          </button>
          <button type="button" onClick={() => onRemove?.(item)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-700/40 bg-rose-900/6 px-3 text-sm font-semibold text-rose-300 hover:border-rose-400/30">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default WatchlistRow;

