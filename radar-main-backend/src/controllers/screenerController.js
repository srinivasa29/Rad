const { runScreener } = require('../services/screenerService');

const runScreenerScan = async (req, res) => {
    try {
        const payload = (req.body && typeof req.body === 'object') ? req.body : {};
        const data = await runScreener(payload);
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to run screener',
        });
    }
};

module.exports = {
    runScreenerScan,
};
