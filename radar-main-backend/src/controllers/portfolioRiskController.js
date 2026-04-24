const { calculatePortfolioRisk } = require('../services/portfolioRiskService');

const getPortfolioRisk = async (req, res) => {
    try {
        const userId = req.user._id;
        const data = await calculatePortfolioRisk(userId);
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to fetch portfolio risk',
        });
    }
};

module.exports = {
    getPortfolioRisk,
};
