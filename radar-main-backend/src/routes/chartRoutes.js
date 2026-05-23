const express = require('express');
const router = express.Router();
const { getHistoricalData } = require('../services/yahooService');
const logger = require('../config/logger');

router.get('/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const { period } = req.query; // e.g. 1d, 5d, 1m, 3m, 6m, 1y, 5y

  logger.info(`[Chart Route Hit] GET chart/candle data for symbol: ${symbol} (period: ${period || '1y'})`);

  try {
    const candles = await getHistoricalData(symbol, period || '1y');
    logger.info(`[Chart Route Success] Candle fetch success for symbol: ${symbol}, count: ${candles.length}`);
    res.json(candles);
  } catch (error) {
    logger.error(`[Chart Route Failure] Failed to fetch chart history for ${symbol}: ${error.message}`);
    res.status(500).json({ 
      error: `Failed to fetch chart history for ${symbol}`, 
      message: error.message 
    });
  }
});

module.exports = router;
