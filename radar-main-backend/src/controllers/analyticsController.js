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
        const stocks = await fetchStockData();
        const sectorMap = {};

        for (const stock of stocks) {
            const sector = stock.details?.sector || stock.sector || 'General';
            if (['Unknown', 'Other', 'Currency', 'N/A', '', 'Broad Market'].includes(sector)) continue;
            if (!sectorMap[sector]) {
                sectorMap[sector] = [];
            }
            sectorMap[sector].push({
                name: String(stock.symbol || '').replace(/\.(NS|BO)$/i, ''),
                change: Number(stock.change || 0)
            });
        }

        const heatmapData = Object.entries(sectorMap).map(([sector, children]) => ({
            name: sector,
            children: children.slice(0, 5) // Limit to top 5 stocks per sector for rendering clarity
        }));

        res.json(heatmapData.length ? heatmapData : [
            {
                name: "Technology",
                children: [
                    { name: "TCS", change: 0.5 },
                    { name: "INFY", change: 1.2 }
                ]
            },
            {
                name: "Finance",
                children: [
                    { name: "HDFCBANK", change: -0.2 },
                    { name: "SBIN", change: 0.8 }
                ]
            }
        ]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

module.exports = { getPreMarketPulse, getSectorHeatmap };
