const {
    getStockFundamentals,
    getStockEarningsCalendar,
    getStockNewsSentiment,
} = require('../services/stockInsightsService');

const getFundamentals = async (req, res) => {
    try {
        const data = await getStockFundamentals(req.params.symbol);
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to fetch fundamentals',
        });
    }
};

const getEarningsCalendar = async (req, res) => {
    try {
        const data = await getStockEarningsCalendar(req.params.symbol);
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to fetch earnings calendar',
        });
    }
};

const getNewsSentiment = async (req, res) => {
    try {
        const data = await getStockNewsSentiment(req.params.symbol);
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to fetch news sentiment',
        });
    }
};

module.exports = {
    getFundamentals,
    getEarningsCalendar,
    getNewsSentiment,
};
