import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Clock, Plus } from 'lucide-react';
import SymbolSearchInput from './SymbolSearchInput';

const EmptyWatchlistState = ({ query, onQueryChange, onAdd, adding }) => (
  <motion.section
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: 'easeOut' }}
    className="relative flex min-h-[min(72vh,640px)] flex-col items-center justify-center px-6 py-16"
  >
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-8 h-56 w-[min(560px,92%)] -translate-x-1/2 rounded-full bg-cyan-500/15 blur-3xl"
    />
    <div className="relative mx-auto w-full max-w-md text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-300 shadow-[0_0_40px_rgba(6,182,212,0.15)]"
      >
        <BarChart3 size={28} strokeWidth={2} />
      </motion.div>

      <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
        Your watchlist is empty
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-400 md:text-base">
        Add stocks to start tracking market research and technical insights.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onAdd(query);
        }}
        className="mt-8 space-y-4 text-left"
      >
        <SymbolSearchInput
          value={query}
          onChange={onQueryChange}
          onSubmit={(event) => {
            event.preventDefault();
            onAdd(query);
          }}
          onSelect={(item) => onAdd(item.symbol)}
          adding={adding}
        />
        <button
          type="submit"
          disabled={adding || !query.trim()}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 text-sm font-black text-slate-950 shadow-[0_12px_35px_rgba(6,182,212,0.28)] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={18} />
          {adding ? 'Adding…' : '+ Add to Watchlist'}
        </button>
      </form>

      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
        <Clock size={14} className="text-cyan-400/80" />
        You can add multiple stocks later anytime.
      </p>
    </div>
  </motion.section>
);

export default EmptyWatchlistState;
