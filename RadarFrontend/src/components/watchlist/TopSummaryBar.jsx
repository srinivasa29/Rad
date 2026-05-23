import React from 'react';

const SummaryCard = ({ title, value, hint, tone = 'neutral' }) => {
  const toneClass = {
    up: 'text-emerald-300',
    down: 'text-rose-300',
    active: 'text-cyan-300',
    neutral: 'text-white',
  }[tone] || 'text-white';

  return (
    <div className="min-w-[180px] flex-1 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{title}</div>
      <div className={`mt-2 text-2xl font-black ${toneClass}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
};

const TopSummaryBar = ({ rows = [], loading, onRefresh }) => {
  const getPercent = (row) => Number(row?.percent ?? row?.changePercent ?? row?.changePct ?? 0);
  const topGainer = rows.slice().sort((a, b) => getPercent(b) - getPercent(a))[0];
  const topLoser = rows.slice().sort((a, b) => getPercent(a) - getPercent(b))[0];
  const mostActive = rows.slice().sort((a, b) => Number(b.volume || 0) - Number(a.volume || 0))[0];

  const marketMood = (() => {
    const avg = rows.reduce((sum, row) => sum + (Number(row.rsi || 50) - 50), 0) / (rows.length || 1);
    if (avg > 8) return 'Bullish';
    if (avg < -8) return 'Bearish';
    return 'Neutral';
  })();

  return (
    <div className="flex flex-wrap items-stretch gap-3">
      <SummaryCard
        title="Top Gainer"
        value={topGainer ? `${topGainer.symbol} +${Math.abs(getPercent(topGainer)).toFixed(2)}%` : '-'}
        tone="up"
      />
      <SummaryCard
        title="Top Loser"
        value={topLoser ? `${topLoser.symbol} ${getPercent(topLoser).toFixed(2)}%` : '-'}
        tone="down"
      />
      <SummaryCard
        title="Most Active"
        value={mostActive ? mostActive.symbol : '-'}
        hint={mostActive ? `${Number(mostActive.volume || 0).toLocaleString('en-IN')} volume` : undefined}
        tone="active"
      />
      <SummaryCard title="Market Mood" value={marketMood} />
      <div className="flex items-center">
        <button
          type="button"
          disabled={loading}
          onClick={onRefresh}
          className="rounded-xl bg-cyan-500 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-950 disabled:opacity-60"
        >
          {loading ? 'Refreshing' : 'Refresh'}
        </button>
      </div>
    </div>
  );
};

export default TopSummaryBar;
