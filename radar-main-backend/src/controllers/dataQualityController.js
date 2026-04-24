const { fetchStockData, fetchStockHistory } = require('../services/stockService');
const { fetchForexData } = require('../services/forexService');
const { fetchCryptoData } = require('../services/cryptoService');

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const summarize = (rows) => {
    const list = Array.isArray(rows) ? rows : [];
    const total = list.length;
    const validPrice = list.filter((row) => toNumber(row?.price) !== null && toNumber(row?.price) > 0).length;
    return {
        total,
        validPrice,
        completenessPct: total > 0 ? Number(((validPrice / total) * 100).toFixed(2)) : 0,
    };
};

const getDataQuality = async (_req, res) => {
    try {
        const [stocks, forex, crypto] = await Promise.all([
            fetchStockData(),
            fetchForexData().catch(() => []),
            fetchCryptoData().catch(() => []),
        ]);

        const topStockSymbol = Array.isArray(stocks) && stocks[0]?.symbol ? stocks[0].symbol : null;
        const stockHistory = topStockSymbol
            ? await fetchStockHistory(topStockSymbol, '1M', { allowSynthetic: false }).catch(() => [])
            : [];

        const freshness = {
            stockHistoryPoints: Array.isArray(stockHistory) ? stockHistory.length : 0,
            checkedSymbol: topStockSymbol,
            checkedAt: new Date().toISOString(),
        };

        return res.json({
            success: true,
            data: {
                quality: {
                    stocks: summarize(stocks),
                    forex: summarize(forex),
                    crypto: summarize(crypto),
                },
                freshness,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to compute data quality',
        });
    }
};

module.exports = {
    getDataQuality,
};
