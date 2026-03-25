/**
 * Real-Time Quotes Routes
 * Endpoints for getting live market data
 * Now with offline mode support
 */

const express = require('express');
const router = express.Router();
const freeApiAggregator = require('../services/freeApiAggregator');
const offlineModeService = require('../services/offlineModeService');
const finnhubService = require('../services/finnhubService');
const twelveDataService = require('../services/twelveDataService');
const logger = require('../utils/logger');

/**
 * GET /api/quotes/:symbol
 * Get real-time quote for a symbol
 * Supports offline fallback
 */
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { source, skipCache, maxAge, useOfflineFallback = 'true' } = req.query;

    const options = {
      preferredSource: source || 'auto',
      skipCache: skipCache === 'true',
      maxAge: maxAge ? parseInt(maxAge) : 60000,
    };

    // Use offline fallback if enabled
    if (useOfflineFallback === 'true') {
      const result = await offlineModeService.getQuoteWithFallback(
        symbol,
        (sym) => freeApiAggregator.getQuote(sym, options)
      );

      res.json({
        success: result.success,
        data: result.data,
        source: result.source,
        cached: result.cached,
        stale: result.stale,
        warning: result.warning,
        age: result.age,
        timestamp: new Date(),
      });
    } else {
      // Original behavior (no fallback)
      const result = await freeApiAggregator.getQuote(symbol, options);

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          source: result.source,
          cached: result.cached || false,
          timestamp: new Date(),
        });
      } else {
        res.status(404).json({
          success: false,
          message: result.message,
          source: result.source,
        });
      }
    }
  } catch (error) {
    logger.error('Error getting quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get quote',
      error: error.message,
    });
  }
});

/**
 * POST /api/quotes/batch
 * Get quotes for multiple symbols
 */
router.post('/batch', async (req, res) => {
  try {
    const { symbols, source, skipCache } = req.body;

    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        message: 'Symbols array is required',
      });
    }

    if (symbols.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 50 symbols allowed per batch',
      });
    }

    const options = {
      preferredSource: source || 'auto',
      skipCache: skipCache === true,
    };

    const results = await freeApiAggregator.getBatchQuotes(symbols, options);

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      total: results.length,
      successful: successCount,
      failed: results.length - successCount,
      data: results,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error getting batch quotes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get batch quotes',
      error: error.message,
    });
  }
});

/**
 * GET /api/quotes/stats
 * Get aggregator statistics
 */
router.get('/stats/all', async (req, res) => {
  try {
    const stats = freeApiAggregator.getStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stats',
      error: error.message,
    });
  }
});

/**
 * POST /api/quotes/stats/reset
 * Reset statistics
 */
router.post('/stats/reset', (req, res) => {
  try {
    freeApiAggregator.resetStats();
    
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

/**
 * GET /api/quotes/test/connections
 * Test all API connections
 */
router.get('/test/connections', async (req, res) => {
  try {
    const results = await freeApiAggregator.testAllConnections();
    
    res.json({
      success: results.success,
      message: results.success 
        ? 'At least one API source is working'
        : 'All API sources are unavailable',
      details: results.details,
    });
  } catch (error) {
    logger.error('Error testing connections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test connections',
      error: error.message,
    });
  }
});

/**
 * GET /api/quotes/ratelimits
 * Get rate limit status for all APIs
 */
router.get('/ratelimits', (req, res) => {
  try {
    const limits = {
      finnhub: finnhubService.getRateLimitStatus(),
      twelvedata: twelveDataService.getRateLimitStatus(),
      yahoo: {
        service: 'yahoo',
        unlimited: true,
        message: 'No rate limits',
      },
    };
    
    res.json({
      success: true,
      data: limits,
    });
  } catch (error) {
    logger.error('Error getting rate limits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rate limits',
      error: error.message,
    });
  }
});

module.exports = router;
