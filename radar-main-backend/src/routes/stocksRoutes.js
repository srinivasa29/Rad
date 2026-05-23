const express = require('express');
const router = express.Router();
const {
    getFundamentals,
    getEarningsCalendar,
    getNewsSentiment,
    getSignals,
    getUnifiedStockData
} = require('../controllers/stockInsightsController');
const { getHistoricalData, getCompareData, getAvailableSymbols, getLatestCandle } = require('../controllers/ohlcController');

const { authMiddleware } = require('../middleware/authMiddleware');
const { validateRequest, validateSymbolParam } = require('../middleware/validationMiddleware');

router.get('/:symbol/fundamentals', authMiddleware, validateSymbolParam, validateRequest, getFundamentals);
router.get('/financials', authMiddleware, async (req, res) => {
    const symbol = req.query.symbol;
    if (!symbol) return res.status(400).json({ success: false, message: 'Symbol required' });
    req.params.symbol = symbol;
    return getFundamentals(req, res);
});

router.get('/:symbol/earnings-calendar', authMiddleware, validateSymbolParam, validateRequest, getEarningsCalendar);
router.get('/:symbol/news-sentiment', authMiddleware, validateSymbolParam, validateRequest, getNewsSentiment);
router.get('/news', authMiddleware, async (req, res) => {
    const symbol = req.query.symbol;
    if (!symbol) return res.status(400).json({ success: false, message: 'Symbol required' });
    req.params.symbol = symbol;
    return getNewsSentiment(req, res);
});

router.get('/:symbol/signals', authMiddleware, validateSymbolParam, validateRequest, getSignals);
router.get('/:symbol/history', validateSymbolParam, validateRequest, getHistoricalData);
router.get('/:symbol/live', validateSymbolParam, validateRequest, getLatestCandle);
router.post('/compare', authMiddleware, getCompareData);
router.get('/search', authMiddleware, getAvailableSymbols);

// Centralized stock aggregator data engine
router.get('/:symbol', authMiddleware, validateSymbolParam, validateRequest, getUnifiedStockData);

module.exports = router;
