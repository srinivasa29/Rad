const express = require('express');
const router = express.Router();
const technicalController = require('../controllers/technicalController');
const { getWatchlistScans } = require('../controllers/researchController');

// Breakouts panel (uses existing breakout alerts)
router.get('/breakouts', async (req, res) => {
    return technicalController.getBreakoutAlerts(req, res);
});

// Indicators panel (uses existing indicator signals)
router.get('/indicators', async (req, res) => {
    return technicalController.getIndicatorSignals(req, res);
});

// Watchlist-driven scans (aggregated signals + timestamps)
router.get('/watchlist-scans', getWatchlistScans);

module.exports = router;
