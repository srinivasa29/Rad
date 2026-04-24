import { useEffect, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { fetchMarketData } from '../../api/marketApi';

const fallbackMoversData = [
    { symbol: 'NVDA', name: 'NVIDIA', price: 531.4, change_24h: 3.4 },
    { symbol: 'AMD', name: 'AMD', price: 145.3, change_24h: 5.1 },
    { symbol: 'COIN', name: 'Coinbase', price: 155.2, change_24h: -4.2 },
    { symbol: 'MARA', name: 'Marathon', price: 22.4, change_24h: -8.5 },
    { symbol: 'PLTR', name: 'Palantir', price: 16.8, change_24h: 1.2 },
];

const formatSignedPercent = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return '0.00%';
    return `${numeric > 0 ? '+' : ''}${numeric.toFixed(2)}%`;
};

export default function MarketTable() {
    const [moversData, setMoversData] = useState(fallbackMoversData);

    useEffect(() => {
        let isMounted = true;

        const loadMovers = async () => {
            try {
                const rows = await fetchMarketData();
                const marketRows = Array.isArray(rows) ? rows : [];

                const movers = marketRows
                    .filter((item) => ['STOCK', 'CRYPTO'].includes(String(item?.type || '').toUpperCase()))
                    .sort((a, b) => Math.abs(Number(b?.change_24h || 0)) - Math.abs(Number(a?.change_24h || 0)))
                    .slice(0, 5);

                if (isMounted && movers.length) {
                    setMoversData(movers);
                }
            } catch (error) {
                console.error('Failed to load market movers:', error);
                if (isMounted) {
                    setMoversData(fallbackMoversData);
                }
            }
        };

        loadMovers();
        const intervalId = setInterval(loadMovers, 30000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    return (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden w-full">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-white">Market Movers</h3>
                <button className="text-[#42C0A5] text-sm font-medium hover:text-[#6FFFE9] transition-colors">View All Match</button>
            </div>

            <div className="p-0">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[#B9F3EA]/60 text-xs uppercase tracking-wider border-b border-white/5">
                            <th className="p-4 font-medium">Symbol</th>
                            <th className="p-4 font-medium">Price</th>
                            <th className="p-4 font-medium text-right">Chg %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {moversData.map((stock, i) => {
                            const change = Number(stock?.change_24h || 0);
                            const isUp = change >= 0;

                            return (
                                <tr
                                    key={i}
                                    className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group cursor-pointer"
                                >
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-white font-bold text-sm group-hover:text-[#42C0A5] transition-colors">{stock.symbol || '--'}</span>
                                            <span className="text-[#B9F3EA]/50 text-xs">{stock.name || 'Market asset'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-white font-mono text-sm">
                                        {Number(stock?.price || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className={`inline-flex items-center gap-1 text-sm font-bold ${isUp ? 'text-[#42C0A5]' : 'text-red-400'}`}>
                                            {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            {formatSignedPercent(change)}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
