import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Tooltip, Area } from 'recharts';
import { useEffect, useState } from 'react';
import { fetchMarketData } from '../../api/marketApi';

const fallbackPortfolioData = [
    { time: '10:00', val: 25250 },
    { time: '10:30', val: 25180 },
    { time: '11:00', val: 25220 },
    { time: '11:30', val: 25280 },
    { time: '12:00', val: 25340 },
    { time: '12:30', val: 25360 },
    { time: '13:00', val: 25370 },
    { time: '13:30', val: 25400 },
    { time: '14:00', val: 25480 },
    { time: '14:30', val: 25520 },
];

const PortfolioTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white px-3 py-2 rounded-lg shadow-xl border border-gray-100 ring-1 ring-black/5 flex flex-col items-center">
                <span className="text-xs font-semibold text-gray-400 mb-1">Live</span>
                <span className="text-sm font-bold text-green-600">
                    val : {payload[0].value}
                </span>
            </div>
        );
    }

    return null;
};

const InvestorPortfolioView = () => {
    const [portfolioData, setPortfolioData] = useState(fallbackPortfolioData);

    useEffect(() => {
        let isMounted = true;

        const appendLivePoint = async () => {
            try {
                const rows = await fetchMarketData({ type: 'STOCK' });
                const stocks = Array.isArray(rows) ? rows.slice(0, 8) : [];

                if (!stocks.length || !isMounted) {
                    return;
                }

                const totalValue = stocks.reduce((sum, row) => sum + (Number(row?.price) || 0), 0);
                const averageChange = stocks.reduce((sum, row) => sum + (Number(row?.change_24h) || 0), 0) / stocks.length;
                const computedValue = totalValue * (1 + averageChange / 100);

                const nextPoint = {
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    val: Number(computedValue.toFixed(2)),
                };

                setPortfolioData((prev) => {
                    const next = [...prev, nextPoint];
                    return next.slice(-14);
                });
            } catch (error) {
                console.error('Failed to update investor portfolio preview:', error);
            }
        };

        appendLivePoint();
        const intervalId = setInterval(() => {
            appendLivePoint();
        }, 30000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full relative shadow-2xl rounded-2xl overflow-hidden border border-gray-100 bg-white group"
        >
            <img
                src="/investor_graph_base.png"
                alt="Investor Market Summary"
                className="w-full h-auto block pointer-events-none select-none"
            />

            <div className="absolute top-[35%] left-[2%] w-[68%] h-[55%] z-10 opacity-0 hover:opacity-100 transition-opacity duration-300">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={portfolioData}>
                        <Tooltip content={<PortfolioTooltip />} cursor={{ stroke: '#059669', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area
                            type="monotone"
                            dataKey="val"
                            stroke="none"
                            fill="transparent"
                            activeDot={{ r: 6, fill: "#059669", stroke: "white", strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default InvestorPortfolioView;
