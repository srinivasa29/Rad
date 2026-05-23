const express = require('express');
const radarAggregationService = require('../services/radarAggregationService');

const router = express.Router();

const parseSymbols = (value) => String(value || '')
  .split(',')
  .map((symbol) => symbol.trim())
  .filter(Boolean);

router.get('/dashboard', async (req, res, next) => {
  try {
    const symbols = parseSymbols(req.query.symbols);
    const data = await radarAggregationService.getDashboard(
      symbols.length ? symbols : radarAggregationService.DEFAULT_SYMBOLS,
      req.query.interval || '5m',
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/symbol/:symbol', async (req, res, next) => {
  try {
    const data = await radarAggregationService.buildSymbolResearch(req.params.symbol, req.query.interval || '5m');
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/quote/:symbol', async (req, res, next) => {
  try {
    const data = await radarAggregationService.getQuote(req.params.symbol);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/candles/:symbol', async (req, res, next) => {
  try {
    const data = await radarAggregationService.getCandles(
      req.params.symbol,
      req.query.interval || '5m',
      Number(req.query.limit || 180),
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
