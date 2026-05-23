import React from 'react';
import TopSummaryBar from './TopSummaryBar';
import RightSidebar from './RightSidebar';
import { useWatchlistResearch } from '../../hooks/useWatchlistResearch';
import WatchlistRow from './WatchlistRow';
import BreakoutsPanel from '../research/BreakoutsPanel';
import IndicatorsPanel from '../research/IndicatorsPanel';
import WatchlistScansPanel from '../research/WatchlistScansPanel';

const ResearchWatchlist = () => {
  const { symbols, rows, loading, refresh } = useWatchlistResearch();

  return (
    <div className="min-h-screen bg-[#071027] text-white p-6">
      <TopSummaryBar rows={rows} loading={loading} onRefresh={refresh} />

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-1"><BreakoutsPanel /></div>
            <div className="md:col-span-1"><IndicatorsPanel /></div>
            <div className="md:col-span-1"><WatchlistScansPanel /></div>
          </div>
        </div>

      </div>

      <div className="mt-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-[rgba(255,255,255,0.02)] rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Research Watchlist</h3>
              <div className="text-sm text-cyan-300">Symbols: {symbols.length}</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed">
                <thead className="text-xs text-gray-300 uppercase">
                  <tr>
                    <th className="w-24 text-left">Symbol</th>
                    <th className="w-20 text-right">Price</th>
                    <th className="w-20 text-right">Change %</th>
                    <th className="w-28 text-right">Volume</th>
                    <th className="w-16 text-right">RSI</th>
                    <th className="w-16 text-right">MACD</th>
                    <th className="w-20 text-center">Trend</th>
                    <th className="w-20 text-center">Signal</th>
                    <th className="w-28 text-center">Sentiment</th>
                    <th className="w-32">Mini Chart</th>
                    <th className="w-20">Alerts</th>
                    <th className="w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={12} className="py-8 text-center text-gray-400">Loading...</td></tr>
                  )}
                  {rows.map(row => (
                    <WatchlistRow key={row.symbol} row={row} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <RightSidebar items={rows.slice(0,6)} />
        </div>
      </div>
    </div>
  );
};

export default ResearchWatchlist;
