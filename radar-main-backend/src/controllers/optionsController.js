const { getOptionsChain, getOptionGreeks } = require('../services/optionsService');

const getChain = async (req, res) => {
    try {
        const { symbol } = req.params;
        const { expiry } = req.query;
        const data = await getOptionsChain(symbol, { expiry });
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to fetch options chain',
        });
    }
};

const getGreeks = async (req, res) => {
    try {
        const { symbol } = req.params;
        const { expiry } = req.query;
        const data = await getOptionGreeks(symbol, { expiry });
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to fetch option greeks',
        });
    }
};

module.exports = {
    getChain,
    getGreeks,
};
