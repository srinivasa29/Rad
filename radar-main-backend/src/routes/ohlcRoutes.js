const express = require('express');
const router = express.Router();
const {
    getHistoricalData,
    getLatestCandle,
    getAvailableSymbols,
} = require('../controllers/ohlcController');
const { protect } = require('../middleware/authMiddleware');

// Public routes (can be accessed without auth for demo purposes)
// Add 'protect' middleware if you want to require authentication

/**
 * @route   GET /api/ohlc/:symbol
 * @desc    Get historical OHLC data for a symbol
 * @access  Public
 * @query   exchange, timeframe, startDate, endDate, limit
 */
router.get('/:symbol', getHistoricalData);

/**
 * @route   GET /api/ohlc/:symbol/latest
 * @desc    Get latest OHLC candle for a symbol
 * @access  Public
 * @query   exchange, timeframe
 */
router.get('/:symbol/latest', getLatestCandle);

/**
 * @route   GET /api/ohlc/symbols/list
 * @desc    Get list of available symbols in database
 * @access  Public
 * @query   exchange (optional)
 */
router.get('/symbols/list', getAvailableSymbols);

module.exports = router;
