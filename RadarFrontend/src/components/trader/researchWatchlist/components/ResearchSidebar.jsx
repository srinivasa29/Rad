import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Bell, ExternalLink, Trash2, WifiOff } from 'lucide-react';
import { compactNumber, currency, toPercent } from '../utils/formatters';

const Metric = ({ label, value, tone = 'text-white' }) => (
  <div className="rounded-lg border border-slate-800/80 bg-slate-950/50 p-3">
    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p>
    <strong className={`mt-1 block text-sm font-black ${tone}`}>{value}</strong>
  </div>
);

const ResearchSidebar = ({ row, onRemove, onOpen, onAlert }) => {
  if (!row) return null;
  const hasError = row.price === null || row.price === undefined;

  return (
    <motion.aside
      key={row.symbol}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-xl border border-slate-800/90 bg-slate-950/55 p-4 backdrop-blur-md xl:sticky xl:top-4 xl:max-h-[calc(100vh-120px)] xl:overflow-y-auto"
    >
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/90">Research Summary</p>
        <h2 className="mt-1 text-xl font-black text-white">{row.symbol}</h2>
        <p className="text-xs text-slate-500">{row.name || 'Equity'}</p>
        
        {hasError ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-950 bg-rose-950/20 px-3 py-2 text-xs font-semibold text-rose-300">
            <WifiOff size={13} className="animate-pulse" />
            <span>Data feed offline. Check API limits or symbol syntax.</span>
          </div>
        ) : (
          <>
            <p className="mt-2 text-lg font-black text-white">{currency(row.price)}</p>
            <p className={`text-sm font-bold ${row.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {toPercent(row.changePercent)}
            </p>
          </>
        )}
      </div>

      {!hasError && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Metric label="RSI" value={row.rsi != null ? row.rsi.toFixed(1) : '—'} />
            <Metric
              label="MACD Hist."
              value={row.indicatorsReady ? row.macd.histogram.toFixed(2) : '—'}
              tone={row.indicatorsReady && row.macd.histogram >= 0 ? 'text-emerald-400' : 'text-rose-400'}
            />
            <Metric label="Trend" value={row.trend} />
            <Metric label="Sentiment" value={row.sentiment} />
          </div>

          <section className="mt-4 rounded-lg border border-slate-800/80 bg-slate-900/40 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-white">
              <BarChart3 size={14} className="text-cyan-400" />
              Technical Snapshot
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              {row.technicalSignal}. RSI {row.rsi != null ? row.rsi.toFixed(1) : '—'}, MACD histogram{' '}
              {row.indicatorsReady ? row.macd.histogram.toFixed(2) : '—'}, volume {compactNumber(row.volume)}.
              {row.source && (
                <span className="mt-2 block text-[10px] text-slate-600">Feed Source: {row.source}</span>
              )}
            </p>
          </section>

          <section className="mt-3 rounded-lg border border-slate-800/80 bg-slate-900/40 p-3">
            <p className="mb-2 text-xs font-black uppercase tracking-wide text-white">Why This Stock?</p>
            {row.signals?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {row.signals.map((signal) => (
                  <span
                    key={signal}
                    className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-0.5 text-[10px] font-black text-cyan-100"
                  >
                    {signal}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No active research signals on latest data.</p>
            )}
          </section>
        </>
      )}

      <button
        type="button"
        disabled={hasError}
        onClick={() => onOpen(row.symbol)}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-xs font-bold transition-all ${
          hasError
            ? 'border-slate-900 bg-slate-950 text-slate-700 cursor-not-allowed'
            : 'border-cyan-400/25 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/15'
        }`}
      >
        <ExternalLink size={14} />
        Open Research Page
      </button>
      
      <button
        type="button"
        onClick={() => onAlert?.(row)}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 py-2.5 text-xs font-bold text-amber-100 hover:bg-amber-400/15"
      >
        <Bell size={14} />
        Set Price Alert
      </button>
      
      <button
        type="button"
        onClick={() => onRemove(row.symbol)}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-rose-400/20 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-500/10"
      >
        <Trash2 size={14} />
        Remove from Watchlist
      </button>
    </motion.aside>
  );
};

export default ResearchSidebar;
