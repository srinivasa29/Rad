

const express = require('express');
const router = express.Router();
const enhancedCacheService = require('../services/enhancedCacheService');
const offlineModeService = require('../services/offlineModeService');
const logger = require('../utils/logger');


router.get('/stats', (req, res) => {
  try {
    const stats = enhancedCacheService.getStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache stats',
      error: error.message,
    });
  }
});


router.post('/clear', (req, res) => {
  try {
    const { cacheType } = req.body;
    
    enhancedCacheService.clear(cacheType);
    
    res.json({
      success: true,
      message: cacheType 
        ? `Cleared ${cacheType} cache`
        : 'Cleared all caches',
    });
  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message,
    });
  }
});


router.post('/warm', async (req, res) => {
  try {
    const freeApiAggregator = require('../services/freeApiAggregator');
    
    const dataFetcher = async (symbol) => {
      const result = await freeApiAggregator.getQuote(`${symbol}.NS`);
      return result.success ? result.data : null;
    };

    const result = await enhancedCacheService.warmCache(dataFetcher);
    
    res.json({
      success: true,
      message: 'Cache warm-up completed',
      data: result,
    });
  } catch (error) {
    logger.error('Error warming cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to warm cache',
      error: error.message,
    });
  }
});


router.get('/keys/:cacheType', (req, res) => {
  try {
    const { cacheType } = req.params;
    const keys = enhancedCacheService.getKeys(cacheType);
    
    res.json({
      success: true,
      cacheType,
      count: keys.length,
      keys,
    });
  } catch (error) {
    logger.error('Error getting cache keys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache keys',
      error: error.message,
    });
  }
});


router.post('/reset-stats', (req, res) => {
  try {
    enhancedCacheService.resetStats();
    
    res.json({
      success: true,
      message: 'Cache statistics reset',
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


router.get('/offline/status', (req, res) => {
  try {
    const status = offlineModeService.getStatus();
    
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error('Error getting offline status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get offline status',
      error: error.message,
    });
  }
});


router.post('/offline/force-online', (req, res) => {
  try {
    offlineModeService.forceOnline();
    
    res.json({
      success: true,
      message: 'System forced online',
    });
  } catch (error) {
    logger.error('Error forcing online:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to force online',
      error: error.message,
    });
  }
});


router.post('/offline/force-offline', (req, res) => {
  try {
    offlineModeService.forceOffline();
    
    res.json({
      success: true,
      message: 'System forced offline (for testing)',
    });
  } catch (error) {
    logger.error('Error forcing offline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to force offline',
      error: error.message,
    });
  }
});

module.exports = router;
