import React from 'react';
import { motion } from 'framer-motion';
import { Bell, ExternalLink, Trash2, WifiOff } from 'lucide-react';
import { compactNumber, currency, toPercent } from '../utils/formatters';

const WatchlistMobileList = ({ rows, selectedSymbol, onSelect, onOpen, onRemove, onAlert }) => (
  <div className="space-y-3 p-4 lg:hidden">
    {rows.map((row, index) => {
      const hasError = row.price === null || row.price === undefined;
      const positive = !hasError && row.changePercent >= 0;
      const active = selectedSymbol === row.symbol;
      
      return (
        <motion.article
          key={row.symbol}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
          onClick={() => !hasError && onSelect(row.symbol)}
          className={`rounded-xl border p-4 backdrop-blur-sm transition ${
            active
              ? 'border-cyan-400/40 bg-cyan-500/[0.08] shadow-[0_0_24px_rgba(6,182,212,0.12)]'
              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-white">{row.symbol}</h3>
              <p className="text-xs text-slate-500">{row.name || 'Equity'}</p>
            </div>
            <div className="text-right">
              {hasError ? (
                <div className="flex items-center gap-1 text-[10px] font-semibold text-rose-400">
                  <WifiOff size={11} />
                  <span>Offline</span>
                </div>
              ) : (
                <>
                  <p className="text-sm font-black text-white">{currency(row.price)}</p>
                  <p className={`text-xs font-bold ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {toPercent(row.changePercent)}
                  </p>
                </>
              )}
            </div>
          </div>

          {!hasError && (
            <>
              <div className="mt-3 grid grid-cols-4 gap-1.5 text-center text-[10px]">
                <div className="rounded-lg bg-slate-900/80 py-2">
                  <p className="text-slate-500 font-semibold">RSI</p>
                  <p className="font-bold text-slate-200">{row.rsi != null ? row.rsi.toFixed(1) : '—'}</p>
                </div>
                <div className="rounded-lg bg-slate-900/80 py-2">
                  <p className="text-slate-500 font-semibold">RVOL</p>
                  <p className="font-bold text-slate-200">{row.rvol != null ? `${row.rvol.toFixed(1)}x` : '—'}</p>
                </div>
                <div className="rounded-lg bg-slate-900/80 py-2">
                  <p className="text-slate-500 font-semibold">Trend</p>
                  <p className="font-bold text-slate-200">{row.trend}</p>
                </div>
                <div className="rounded-lg bg-slate-900/80 py-2">
                  <p className="text-slate-500 font-semibold">Vol</p>
                  <p className="font-bold text-slate-200">{compactNumber(row.volume)}</p>
                </div>
              </div>
              <p className="mt-2 text-center text-[10px] font-black uppercase tracking-wider text-cyan-200/90">
                {row.technicalSignal}
              </p>
            </>
          )}

          {hasError && (
            <p className="mt-2 text-xs text-rose-400/85">
              Data unavailable — Awaiting live market data ({row.error || 'Connection error'})
            </p>
          )}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={hasError}
              onClick={(event) => {
                event.stopPropagation();
                if (!hasError) onOpen(row.symbol);
              }}
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg border py-2 text-xs font-bold transition-all ${
                hasError
                  ? 'border-slate-900 bg-slate-950 text-slate-700 cursor-not-allowed'
                  : 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20'
              }`}
            >
              <ExternalLink size={14} />
              Research
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onAlert?.(row);
              }}
              className={`grid h-9 w-9 place-items-center rounded-lg border transition-all duration-200 ${
                row.alertStatus
                  ? 'border-amber-400/40 bg-amber-400/20 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.2)]'
                  : 'border-slate-800 bg-slate-900/60 text-slate-500 hover:text-slate-300'
              }`}
            >
              <Bell size={14} className={row.alertStatus ? 'animate-bounce' : ''} />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRemove(row.symbol);
              }}
              className="grid h-9 w-9 place-items-center rounded-lg border border-rose-400/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:border-rose-400/40"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </motion.article>
      );
    })}
  </div>
);

export default WatchlistMobileList;
