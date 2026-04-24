const { fetchStockData } = require('../services/stockService');

const getPreMarketPulse = async (req, res) => {
    try {
        const stocks = await fetchStockData();

        const sortedByChangeDesc = [...stocks].sort((a, b) => Number(b.change || 0) - Number(a.change || 0));
        const sortedByChangeAsc = [...stocks].sort((a, b) => Number(a.change || 0) - Number(b.change || 0));

        const gapUp = sortedByChangeDesc.slice(0, 5).map((s) => ({
            symbol: s.symbol,
            change: `${Number(s.change || 0) >= 0 ? '+' : ''}${Number(s.change || 0).toFixed(2)}%`,
            price: s.price,
        }));
        const gapDown = sortedByChangeAsc.slice(0, 5).map((s) => ({
            symbol: s.symbol,
            change: `${Number(s.change || 0).toFixed(2)}%`,
            price: s.price,
        }));

        const volumeShockers = sortedByChangeDesc.slice(0, 6).map((s, index) => ({
            symbol: s.symbol,
            volume: `${15 + index}M`,
            avgVolume: `${9 + index}M`,
            shock: `${(1.3 + (index * 0.1)).toFixed(1)}x`,
        }));

        res.json({
            gapUp,
            gapDown,
            volumeShockers
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

const getSectorHeatmap = async (req, res) => {
    try {
        const heatmapData = [
            {
                name: "Technology",
                children: [
                    { name: "AAPL", size: 2700, change: 1.25 },
                    { name: "MSFT", size: 2300, change: -0.5 },
                    { name: "NVDA", size: 1200, change: 5.4 }
                ]
            },
            {
                name: "Automotive",
                children: [
                    { name: "TSLA", size: 750, change: -3.1 },
                    { name: "F", size: 45, change: 0.2 }
                ]
            },
            {
                name: "Finance",
                children: [
                    { name: "JPM", size: 400, change: 1.1 },
                    { name: "BAC", size: 250, change: 0.8 }
                ]
            }
        ];

        res.json(heatmapData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

module.exports = { getPreMarketPulse, getSectorHeatmap };
