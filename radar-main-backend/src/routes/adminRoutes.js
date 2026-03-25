const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const historicalDataBackfillService = require('../services/historicalDataBackfillService');
const logger = require('../config/logger');

/**
 * Admin routes for managing historical data backfill
 * These should be protected in production!
 */

/**
 * @route   POST /api/admin/backfill/nifty50
 * @desc    Trigger Nifty 50 backfill
 * @access  Admin only (add auth middleware in production!)
 */
router.post('/backfill/nifty50', asyncHandler(async (req, res) => {
    const { timeframe = '1d', range = '1y' } = req.body;

    logger.info(`Admin triggered Nifty 50 backfill (${timeframe}, ${range})`);

    // Run backfill in background (don't wait for completion)
    historicalDataBackfillService.backfillNifty50(timeframe, range)
        .then(results => {
            logger.info(`Backfill completed: ${results.success.length} success, ${results.failed.length} failed`);
        })
        .catch(error => {
            logger.error(`Backfill failed: ${error.message}`);
        });

    res.json({
        success: true,
        message: 'Backfill started for Nifty 50',
        timeframe,
        range,
        note: 'Process running in background. Check logs for progress.',
    });
}));

/**
 * @route   POST /api/admin/backfill/sensex30
 * @desc    Trigger Sensex 30 backfill
 * @access  Admin only
 */
router.post('/backfill/sensex30', asyncHandler(async (req, res) => {
    const { timeframe = '1d', range = '1y' } = req.body;

    logger.info(`Admin triggered Sensex 30 backfill (${timeframe}, ${range})`);

    historicalDataBackfillService.backfillSensex30(timeframe, range)
        .then(results => {
            logger.info(`Backfill completed: ${results.success.length} success, ${results.failed.length} failed`);
        })
        .catch(error => {
            logger.error(`Backfill failed: ${error.message}`);
        });

    res.json({
        success: true,
        message: 'Backfill started for Sensex 30',
        timeframe,
        range,
        note: 'Process running in background. Check logs for progress.',
    });
}));

/**
 * @route   POST /api/admin/backfill/symbol
 * @desc    Trigger backfill for a specific symbol
 * @access  Admin only
 */
router.post('/backfill/symbol', asyncHandler(async (req, res) => {
    const { symbol, exchange = 'NSE', timeframe = '1d', range = '1y' } = req.body;

    if (!symbol) {
        res.status(400);
        throw new Error('Symbol is required');
    }

    logger.info(`Admin triggered backfill for ${symbol}`);

    const result = await historicalDataBackfillService.backfillSymbol(
        symbol,
        exchange,
        timeframe,
        range
    );

    res.json({
        success: result.success,
        message: result.message || 'Backfill completed',
        symbol,
        exchange,
        timeframe,
        count: result.count || 0,
    });
}));

/**
 * @route   GET /api/admin/symbols/nifty50
 * @desc    Get list of Nifty 50 symbols
 * @access  Public
 */
router.get('/symbols/nifty50', (req, res) => {
    const symbols = historicalDataBackfillService.getNifty50Symbols();
    res.json({
        success: true,
        count: symbols.length,
        symbols,
    });
});

/**
 * @route   GET /api/admin/symbols/sensex30
 * @desc    Get list of Sensex 30 symbols
 * @access  Public
 */
router.get('/symbols/sensex30', (req, res) => {
    const symbols = historicalDataBackfillService.getSensex30Symbols();
    res.json({
        success: true,
        count: symbols.length,
        symbols,
    });
});

module.exports = router;
