const { getSectorPerformance } = require('../services/sectorService');

const getSectorPerformanceHandler = async (req, res) => {
    try {
        const { period = '1y' } = req.query;

        const validPeriods = ['1d', '1w', '1m', '3m', '6m', '1y'];
        if (!validPeriods.includes(period.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: `Invalid period. Must be one of: ${validPeriods.join(', ')}`
            });
        }

        const data = await getSectorPerformance(period);
        res.json({ success: true, period, data });
    } catch (error) {
        console.error('Sector performance error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to compute sector performance' });
    }
};

module.exports = { getSectorPerformanceHandler };
