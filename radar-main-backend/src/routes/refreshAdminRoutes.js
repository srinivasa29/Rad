

const express = require('express');
const router = express.Router();
const smartRefreshService = require('../services/smartRefreshService');
const logger = require('../utils/logger');


router.get('/status', (req, res) => {
  try {
    const status = smartRefreshService.getStatus();
    
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error('Error getting refresh status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get status',
      error: error.message,
    });
  }
});


router.post('/start', (req, res) => {
  try {
    smartRefreshService.start();
    
    res.json({
      success: true,
      message: 'Smart refresh service started',
    });
  } catch (error) {
    logger.error('Error starting refresh:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start refresh',
      error: error.message,
    });
  }
});


router.post('/stop', (req, res) => {
  try {
    smartRefreshService.stop();
    
    res.json({
      success: true,
      message: 'Smart refresh service stopped',
    });
  } catch (error) {
    logger.error('Error stopping refresh:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop refresh',
      error: error.message,
    });
  }
});


router.post('/add-symbol', (req, res) => {
  try {
    const { symbol, tier = 2 } = req.body;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Symbol is required',
      });
    }

    if (![1, 2, 3].includes(tier)) {
      return res.status(400).json({
        success: false,
        message: 'Tier must be 1, 2, or 3',
      });
    }

    const added = smartRefreshService.addSymbolToTier(symbol, tier);

    res.json({
      success: true,
      message: added 
        ? `Symbol ${symbol} added to tier ${tier}`
        : `Symbol ${symbol} already in tier ${tier}`,
      data: {
        symbol,
        tier,
        currentTier: smartRefreshService.getSymbolTier(symbol),
      },
    });
  } catch (error) {
    logger.error('Error adding symbol:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add symbol',
      error: error.message,
    });
  }
});


router.post('/add-symbols', (req, res) => {
  try {
    const { symbols, tier = 2 } = req.body;

    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        message: 'Symbols array is required',
      });
    }

    if (![1, 2, 3].includes(tier)) {
      return res.status(400).json({
        success: false,
        message: 'Tier must be 1, 2, or 3',
      });
    }

    smartRefreshService.addSymbolsToTier(symbols, tier);

    res.json({
      success: true,
      message: `${symbols.length} symbols added to tier ${tier}`,
      data: {
        symbols,
        tier,
        count: symbols.length,
      },
    });
  } catch (error) {
    logger.error('Error adding symbols:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add symbols',
      error: error.message,
    });
  }
});


router.post('/remove-symbol', (req, res) => {
  try {
    const { symbol } = req.body;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Symbol is required',
      });
    }

    smartRefreshService.removeSymbol(symbol);

    res.json({
      success: true,
      message: `Symbol ${symbol} removed from all tiers`,
    });
  } catch (error) {
    logger.error('Error removing symbol:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove symbol',
      error: error.message,
    });
  }
});


router.get('/symbol/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    const tier = smartRefreshService.getSymbolTier(symbol);

    if (tier === null) {
      return res.status(404).json({
        success: false,
        message: 'Symbol not found in any tier',
      });
    }

    res.json({
      success: true,
      data: {
        symbol,
        tier,
        refreshInterval: tier === 1 ? '1 minute' : tier === 2 ? '5 minutes' : '15 minutes',
      },
    });
  } catch (error) {
    logger.error('Error getting symbol tier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get symbol tier',
      error: error.message,
    });
  }
});


router.get('/stats', (req, res) => {
  try {
    const stats = smartRefreshService.getStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting refresh stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stats',
      error: error.message,
    });
  }
});

module.exports = router;
