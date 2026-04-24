

const express = require('express');
const router = express.Router();
const dataUpdateCron = require('../services/dataUpdateCron');
const incrementalUpdateService = require('../services/incrementalUpdateService');
const marketHoursService = require('../services/marketHoursService');
const logger = require('../utils/logger');


router.get('/update-status', (req, res) => {
  try {
    const status = dataUpdateCron.getStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error('Error getting update status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get update status',
      error: error.message,
    });
  }
});


router.post('/trigger-update', async (req, res) => {
  try {
    const { symbols, timeframe, force } = req.body;

    logger.info('Manual update triggered via API', { symbols, timeframe, force });

    const result = await dataUpdateCron.triggerManualUpdate({
      symbols,
      timeframe,
      force,
    });

    res.json({
      success: true,
      message: 'Update completed',
      data: result,
    });
  } catch (error) {
    logger.error('Error triggering manual update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger update',
      error: error.message,
    });
  }
});


router.post('/update-symbol', async (req, res) => {
  try {
    const { symbol, timeframe = '1d' } = req.body;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Symbol is required',
      });
    }

    logger.info('Updating specific symbol via API', { symbol, timeframe });

    const result = await incrementalUpdateService.updateSymbol(symbol, timeframe);

    res.json({
      success: true,
      message: `Symbol ${symbol} updated`,
      data: result,
    });
  } catch (error) {
    logger.error('Error updating symbol:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update symbol',
      error: error.message,
    });
  }
});


router.get('/market-status', (req, res) => {
  try {
    const status = marketHoursService.getMarketStatus();
    const timeUntilNext = marketHoursService.getTimeUntilNextEvent();

    res.json({
      success: true,
      data: {
        ...status,
        timeUntilNextEvent: timeUntilNext,
      },
    });
  } catch (error) {
    logger.error('Error getting market status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get market status',
      error: error.message,
    });
  }
});


router.get('/update-stats', (req, res) => {
  try {
    const stats = incrementalUpdateService.getStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting update stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stats',
      error: error.message,
    });
  }
});


router.post('/reset-stats', (req, res) => {
  try {
    incrementalUpdateService.resetStats();
    res.json({
      success: true,
      message: 'Statistics reset successfully',
    });
  } catch (error) {
    logger.error('Error resetting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset stats',
      error: error.message,
    });
  }
});


router.post('/start-cron', (req, res) => {
  try {
    dataUpdateCron.start();
    res.json({
      success: true,
      message: 'Cron job started',
    });
  } catch (error) {
    logger.error('Error starting cron:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start cron',
      error: error.message,
    });
  }
});


router.post('/stop-cron', (req, res) => {
  try {
    dataUpdateCron.stop();
    res.json({
      success: true,
      message: 'Cron job stopped',
    });
  } catch (error) {
    logger.error('Error stopping cron:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop cron',
      error: error.message,
    });
  }
});

module.exports = router;
