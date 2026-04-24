const { fetchStockData } = require('../services/stockService');

const getEarningsSummary = async (req, res) => {
    try {
        const stocks = await fetchStockData();
        const summary = stocks.map(s => ({
            symbol: s.symbol,
            revenue: s.financials.revenue,
            profit: s.financials.net_profit,
            quarters: s.financials.quarters
        }));
        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
};

module.exports = { getEarningsSummary };
