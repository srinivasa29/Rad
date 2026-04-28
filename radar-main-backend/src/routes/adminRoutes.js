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
    res.json({ success: true, count: symbols.length, symbols });
});

router.get('/symbols/all', (req, res) => {
    const symbols = historicalDataBackfillService.getAllNseSymbols();
    res.json({ success: true, count: symbols.length, symbols });
});

// Fire-and-forget full universe backfill (~200 NSE symbols, batched)
router.post('/backfill/full-universe', asyncHandler(async (req, res) => {
    const { timeframe = '1d', range = '1y' } = req.body;
    logger.info(`Admin triggered FULL UNIVERSE backfill (${timeframe}, ${range})`);
    historicalDataBackfillService.backfillFullUniverse(timeframe, range)
        .then(r => logger.info(`Full universe done: ${r.success.length} ok, ${r.failed.length} fail, ${r.skipped.length} skip`))
        .catch(e => logger.error(`Full universe backfill error: ${e.message}`));
    res.json({ success: true, message: 'Full universe backfill started (~200 NSE symbols)', timeframe, range, note: 'Running in background. Check logs for progress.' });
}));

router.post('/backfill/nifty-next50', asyncHandler(async (req, res) => {
    const { timeframe = '1d', range = '1y' } = req.body;
    historicalDataBackfillService.backfillNiftyNext50(timeframe, range)
        .then(r => logger.info(`Next50 done: ${r.success.length} ok`))
        .catch(e => logger.error(`Next50 backfill error: ${e.message}`));
    res.json({ success: true, message: 'Nifty Next 50 backfill started', timeframe, range });
}));

router.post('/backfill/midcap', asyncHandler(async (req, res) => {
    const { timeframe = '1d', range = '1y' } = req.body;
    historicalDataBackfillService.backfillMidcap(timeframe, range)
        .then(r => logger.info(`Midcap done: ${r.success.length} ok`))
        .catch(e => logger.error(`Midcap backfill error: ${e.message}`));
    res.json({ success: true, message: 'Midcap 100 backfill started', timeframe, range });
}));

module.exports = router;
