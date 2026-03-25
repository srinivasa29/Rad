/**
 * Offline Mode Service
 * Graceful degradation when APIs fail
 * Serves cached data with staleness warnings
 */

const enhancedCacheService = require('./enhancedCacheService');
const ohlcService = require('./ohlcService');
const logger = require('../utils/logger');

class OfflineModeService {
  constructor() {
    this.isOnline = true;
    this.failureCount = 0;
    this.maxFailuresBeforeOffline = 3;
    this.lastCheck = Date.now();
    this.checkInterval = 60000; // 1 minute
  }

  /**
   * Get quote with offline fallback
   * @param {string} symbol - Stock symbol
   * @param {Function} onlineFetcher - Function to fetch online data
   * @returns {Promise<Object>}
   */
  async getQuoteWithFallback(symbol, onlineFetcher) {
    try {
      // Try online first
      const onlineData = await onlineFetcher(symbol);
      
      if (onlineData && onlineData.success) {
        // Online fetch successful
        this.recordSuccess();
        
        // Cache the fresh data
        enhancedCacheService.set('quotes', symbol, onlineData.data, 300);
        
        return {
          success: true,
          data: onlineData.data,
          source: onlineData.source || 'online',
          cached: false,
          stale: false,
        };
      } else {
        // Online fetch failed, try offline
        this.recordFailure();
        return await this.getOfflineData(symbol, 'quote');
      }
    } catch (error) {
      logger.error(`Online fetch error for ${symbol}:`, error.message);
      this.recordFailure();
      return await this.getOfflineData(symbol, 'quote');
    }
  }

  /**
   * Get OHLC data with offline fallback
   * @param {string} symbol - Stock symbol
   * @param {string} timeframe - Timeframe
   * @param {Function} onlineFetcher - Function to fetch online data
   * @returns {Promise<Object>}
   */
  async getOHLCWithFallback(symbol, timeframe, onlineFetcher) {
    try {
      // Try online first
      const onlineData = await onlineFetcher(symbol, timeframe);
      
      if (onlineData && onlineData.success) {
        this.recordSuccess();
        
        // Cache the data
        const cacheKey = `${symbol}:${timeframe}`;
        enhancedCacheService.set('ohlc', cacheKey, onlineData.data, 300);
        
        return {
          success: true,
          data: onlineData.data,
          source: 'online',
          cached: false,
          stale: false,
        };
      } else {
        this.recordFailure();
        return await this.getOfflineData(symbol, 'ohlc', timeframe);
      }
    } catch (error) {
      logger.error(`Online OHLC fetch error:`, error.message);
      this.recordFailure();
      return await this.getOfflineData(symbol, 'ohlc', timeframe);
    }
  }

  /**
   * Get offline/cached data
   * @param {string} symbol - Stock symbol
   * @param {string} dataType - Data type (quote, ohlc)
   * @param {string} timeframe - Optional timeframe for OHLC
   * @returns {Promise<Object>}
   */
  async getOfflineData(symbol, dataType = 'quote', timeframe = '1d') {
    logger.info(`Attempting offline fallback for ${symbol} (${dataType})`);

    try {
      if (dataType === 'quote') {
        // Try cache first
        const cached = enhancedCacheService.get('quotes', symbol);
        if (cached) {
          return {
            success: true,
            data: cached,
            source: 'cache',
            cached: true,
            stale: true,
            warning: 'Using cached data - API unavailable',
          };
        }

        // Try OHLC database as fallback
        const ohlcData = await ohlcService.getLatest(symbol, timeframe);
        if (ohlcData.success && ohlcData.data) {
          const quoteFromOHLC = this.convertOHLCToQuote(ohlcData.data, symbol);
          return {
            success: true,
            data: quoteFromOHLC,
            source: 'database',
            cached: true,
            stale: this.isDataStale(ohlcData.data.timestamp),
            warning: 'Using database fallback - API unavailable',
            age: this.getDataAge(ohlcData.data.timestamp),
          };
        }
      } else if (dataType === 'ohlc') {
        // Try cache
        const cacheKey = `${symbol}:${timeframe}`;
        const cached = enhancedCacheService.get('ohlc', cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached,
            source: 'cache',
            cached: true,
            stale: true,
            warning: 'Using cached data - API unavailable',
          };
        }

        // Try database
        const dbData = await ohlcService.getOHLCData({
          symbol,
          timeframe,
          limit: 100,
        });

        if (dbData.success && dbData.data.length > 0) {
          return {
            success: true,
            data: dbData.data,
            source: 'database',
            cached: true,
            stale: this.isDataStale(dbData.data[dbData.data.length - 1].timestamp),
            warning: 'Using database fallback - API unavailable',
          };
        }
      }

      // No data available anywhere
      return {
        success: false,
        message: 'No cached or database data available',
        offline: true,
        warning: 'System is offline and no cached data exists for this symbol',
      };
    } catch (error) {
      logger.error('Error getting offline data:', error.message);
      return {
        success: false,
        message: error.message,
        offline: true,
      };
    }
  }

  /**
   * Convert OHLC data to quote format
   * @param {Object} ohlc - OHLC data
   * @param {string} symbol - Symbol
   * @returns {Object}
   */
  convertOHLCToQuote(ohlc, symbol) {
    return {
      symbol,
      current: ohlc.close,
      open: ohlc.open,
      high: ohlc.high,
      low: ohlc.low,
      volume: ohlc.volume,
      timestamp: ohlc.timestamp,
      previousClose: null,
      change: null,
      changePercent: null,
    };
  }

  /**
   * Check if data is stale (older than 1 hour)
   * @param {Date|string} timestamp - Data timestamp
   * @returns {boolean}
   */
  isDataStale(timestamp) {
    const age = Date.now() - new Date(timestamp).getTime();
    return age > 3600000; // 1 hour
  }

  /**
   * Get human-readable data age
   * @param {Date|string} timestamp - Data timestamp
   * @returns {string}
   */
  getDataAge(timestamp) {
    const ageMs = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(ageMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day(s) old`;
    if (hours > 0) return `${hours} hour(s) old`;
    if (minutes > 0) return `${minutes} minute(s) old`;
    return 'Just now';
  }

  /**
   * Record successful API call
   */
  recordSuccess() {
    this.failureCount = 0;
    if (!this.isOnline) {
      this.isOnline = true;
      logger.info('System back online');
    }
  }

  /**
   * Record failed API call
   */
  recordFailure() {
    this.failureCount++;
    
    if (this.failureCount >= this.maxFailuresBeforeOffline && this.isOnline) {
      this.isOnline = false;
      logger.warn(`System entering offline mode after ${this.failureCount} failures`);
    }
  }

  /**
   * Get offline mode status
   * @returns {Object}
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      failureCount: this.failureCount,
      maxFailures: this.maxFailuresBeforeOffline,
      lastCheck: new Date(this.lastCheck),
      mode: this.isOnline ? 'online' : 'offline',
      message: this.isOnline 
        ? 'System is online and operational'
        : 'System is in offline mode - serving cached data',
    };
  }

  /**
   * Force online mode
   */
  forceOnline() {
    this.isOnline = true;
    this.failureCount = 0;
    logger.info('Forced system online');
  }

  /**
   * Force offline mode
   */
  forceOffline() {
    this.isOnline = false;
    logger.info('Forced system offline');
  }
}

module.exports = new OfflineModeService();
