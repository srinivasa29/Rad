import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ label, value, tone = 'text-white', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="rounded-xl border border-slate-800/90 bg-slate-950/60 p-4 backdrop-blur-sm"
  >
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
    <strong className={`mt-2 block text-2xl font-black md:text-3xl ${tone}`}>{value}</strong>
  </motion.div>
);

const WatchlistSummaryCards = ({ stats }) => (
  <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
    <Card label="Tracked Stocks" value={stats.tracked} delay={0} />
    <Card label="Research Signals" value={stats.signals} tone="text-cyan-300" delay={0.05} />
    <Card label="Volume Spikes" value={stats.volumeSpikes} tone="text-amber-300" delay={0.1} />
    <Card label="Breakout Candidates" value={stats.breakouts} tone="text-emerald-300" delay={0.15} />
  </section>
);

export default WatchlistSummaryCards;
