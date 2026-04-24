const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const historicalDataBackfillService = require('../services/historicalDataBackfillService');
const logger = require('../config/logger');




router.post('/backfill/nifty50', asyncHandler(async (req, res) => {
    const { timeframe = '1d', range = '1y' } = req.body;

    logger.info(`Admin triggered Nifty 50 backfill (${timeframe}, ${range})`);

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


router.get('/symbols/nifty50', (req, res) => {
    const symbols = historicalDataBackfillService.getNifty50Symbols();
    res.json({
        success: true,
        count: symbols.length,
        symbols,
    });
});


router.get('/symbols/sensex30', (req, res) => {
    const symbols = historicalDataBackfillService.getSensex30Symbols();
    res.json({
        success: true,
        count: symbols.length,
        symbols,
    });
});

module.exports = router;
