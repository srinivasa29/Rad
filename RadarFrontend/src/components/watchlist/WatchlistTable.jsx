import React from 'react';
import WatchlistRow from './WatchlistRow';

const HeaderCell = ({ children }) => (
    <div className="text-xs text-gray-500 px-2 py-1">{children}</div>
);

const WatchlistTable = ({ rows = [], loading = false }) => {
    if (loading) {
        return (
            <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
                ))}
            </div>
        );
    }

    if (!rows || rows.length === 0) {
        return <div className="p-6 text-center text-gray-500">Your watchlist is empty.</div>;
    }

    return (
        <div className="w-full bg-white rounded shadow-sm">
            <div className="grid grid-cols-12 gap-2 border-b px-3 py-2">
                <HeaderCell>Symbol</HeaderCell>
                <HeaderCell className="col-span-2">Price</HeaderCell>
                <HeaderCell>Change%</HeaderCell>
                <HeaderCell>Volume</HeaderCell>
                <HeaderCell>RSI</HeaderCell>
                <HeaderCell>MACD</HeaderCell>
                <HeaderCell>VWAP</HeaderCell>
                <HeaderCell>VolSpike</HeaderCell>
                <HeaderCell>RelStr</HeaderCell>
                <HeaderCell>Trend</HeaderCell>
                <HeaderCell>Score</HeaderCell>
                <HeaderCell>Actions</HeaderCell>
            </div>
            <div>
                {rows.map((r) => (
                    <WatchlistRow key={r.symbol} row={r} />
                ))}
            </div>
        </div>
    );
};

export default WatchlistTable;
