import React from 'react';
import WatchlistTable from '../components/watchlist/WatchlistTable';
import { useWatchlist } from '../context/WatchlistContext';

const WatchlistDashboard = () => {
    const { rows, loading, load } = useWatchlist();

    return (
        <div className="p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Trader Watchlist Dashboard</h2>
                <button
                    type="button"
                    onClick={load}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:border-cyan-500/30"
                >
                    Refresh synced watchlist
                </button>
            </div>
            <WatchlistTable rows={rows} loading={loading} />
        </div>
    );
};

export default WatchlistDashboard;
