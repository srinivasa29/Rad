import { useEffect, useMemo, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { fetchMarketData } from '../../api/marketApi';

const FALLBACK_ROWS = [
    { symbol: 'NVDA', name: 'NVIDIA', price: 531.4, change_24h: 3.4 },
    { symbol: 'AAPL', name: 'Apple', price: 185.92, change_24h: 0.5 },
    { symbol: 'BTC', name: 'Bitcoin', price: 83915, change_24h: 1.2 },
    { symbol: 'EURUSD', name: 'EUR/USD', price: 1.0842, change_24h: -0.1 },
];

const formatSignedPercent = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return '0.00%';
    return `${numeric > 0 ? '+' : ''}${numeric.toFixed(2)}%`;
};

const formatPrice = (row) => {
    const price = Number(row?.price || 0);
    const symbol = String(row?.symbol || '').toUpperCase();
    const type = String(row?.type || '').toUpperCase();

    if (type === 'FOREX' || symbol.includes('USD')) {
        return price.toFixed(4);
    }

    if (price >= 1000) {
        return price.toLocaleString();
    }

    return price.toFixed(2);
};

const LaptopTradingView = () => {
    const [rows, setRows] = useState(FALLBACK_ROWS);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadRows = async (silent = false) => {
            try {
                if (!silent) {
                    setIsLoading(true);
                }

                const marketRows = await fetchMarketData();
                const safeRows = Array.isArray(marketRows) ? marketRows : [];

                const prioritized = safeRows
                    .filter((item) => ['STOCK', 'CRYPTO', 'FOREX'].includes(String(item?.type || '').toUpperCase()))
                    .sort((a, b) => Math.abs(Number(b?.change_24h || 0)) - Math.abs(Number(a?.change_24h || 0)))
                    .slice(0, 6);

                if (isMounted && prioritized.length) {
                    setRows(prioritized);
                }
            } catch (error) {
                console.error('Failed to load trader visual data:', error);
                if (isMounted) {
                    setRows(FALLBACK_ROWS);
                }
            } finally {
                if (isMounted && !silent) {
                    setIsLoading(false);
                }
            }
        };

        loadRows(false);
        const intervalId = setInterval(() => {
            loadRows(true);
        }, 20000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    const marketBreadth = useMemo(() => {
        const gainers = rows.filter((item) => Number(item?.change_24h || 0) > 0).length;
        const losers = rows.filter((item) => Number(item?.change_24h || 0) < 0).length;
        return { gainers, losers };
    }, [rows]);

    return (
        <div className="w-full relative shadow-[0_0_60px_-15px_rgba(56,189,248,0.3)] rounded-xl overflow-hidden border border-[#38BDF8]/20 bg-[#0B1221] group transition-all duration-300 p-4">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#94a3b8]">Live market terminal</div>
                    <div className="text-white text-sm font-bold">Radar Trader Preview</div>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                    <span className="w-2 h-2 rounded-full bg-[#42C0A5] animate-pulse"></span>
                    <span className="text-[#42C0A5] font-bold">LIVE</span>
                </div>
            </div>

            <div className="rounded-lg border border-white/10 overflow-hidden bg-[#0f172a]/80">
                <div className="grid grid-cols-[1fr_1fr_auto] px-3 py-2 text-[10px] uppercase tracking-wider text-[#64748b] border-b border-white/10">
                    <span>Symbol</span>
                    <span>Price</span>
                    <span>24h</span>
                </div>

                <div className="divide-y divide-white/5">
                    {rows.map((row, index) => {
                        const change = Number(row?.change_24h || 0);
                        const isUp = change >= 0;
                        return (
                            <div key={`${row.symbol || 'asset'}-${index}`} className="grid grid-cols-[1fr_1fr_auto] px-3 py-2.5 text-xs items-center hover:bg-white/5 transition-colors">
                                <div className="min-w-0">
                                    <div className="text-white font-bold truncate">{row.symbol}</div>
                                    <div className="text-[#64748b] text-[10px] truncate">{row.name}</div>
                                </div>
                                <div className="text-[#e2e8f0] font-mono">{formatPrice(row)}</div>
                                <div className={`font-mono font-bold flex items-center gap-1 ${isUp ? 'text-[#42C0A5]' : 'text-[#ed5750]'}`}>
                                    {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    {formatSignedPercent(change)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-md bg-white/5 border border-white/10 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-[#64748b]">Gainers</div>
                    <div className="text-[#42C0A5] font-bold">{marketBreadth.gainers}</div>
                </div>
                <div className="rounded-md bg-white/5 border border-white/10 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-[#64748b]">Losers</div>
                    <div className="text-[#ed5750] font-bold">{marketBreadth.losers}</div>
                </div>
            </div>

            {isLoading && (
                <div className="absolute inset-0 bg-[#020617]/60 backdrop-blur-[1px] flex items-center justify-center text-[10px] font-mono uppercase tracking-wider text-[#94a3b8]">
                    Syncing market feed...
                </div>
            )}
        </div>
    );
};

export default LaptopTradingView;
