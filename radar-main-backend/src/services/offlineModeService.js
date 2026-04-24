

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

  
  async getQuoteWithFallback(symbol, onlineFetcher) {
    try {
      const onlineData = await onlineFetcher(symbol);
      
      if (onlineData && onlineData.success) {
        this.recordSuccess();
        
        enhancedCacheService.set('quotes', symbol, onlineData.data, 300);
        
        return {
          success: true,
          data: onlineData.data,
          source: onlineData.source || 'online',
          cached: false,
          stale: false,
        };
      } else {
        this.recordFailure();
        return await this.getOfflineData(symbol, 'quote');
      }
    } catch (error) {
      logger.error(`Online fetch error for ${symbol}:`, error.message);
      this.recordFailure();
      return await this.getOfflineData(symbol, 'quote');
    }
  }

  
  async getOHLCWithFallback(symbol, timeframe, onlineFetcher) {
    try {
      const onlineData = await onlineFetcher(symbol, timeframe);
      
      if (onlineData && onlineData.success) {
        this.recordSuccess();
        
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

  
  async getOfflineData(symbol, dataType = 'quote', timeframe = '1d') {
    logger.info(`Attempting offline fallback for ${symbol} (${dataType})`);

    try {
      if (dataType === 'quote') {
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

  
  isDataStale(timestamp) {
    const age = Date.now() - new Date(timestamp).getTime();
    return age > 3600000; // 1 hour
  }

  
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

  
  recordSuccess() {
    this.failureCount = 0;
    if (!this.isOnline) {
      this.isOnline = true;
      logger.info('System back online');
    }
  }

  
  recordFailure() {
    this.failureCount++;
    
    if (this.failureCount >= this.maxFailuresBeforeOffline && this.isOnline) {
      this.isOnline = false;
      logger.warn(`System entering offline mode after ${this.failureCount} failures`);
    }
  }

  
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

  
  forceOnline() {
    this.isOnline = true;
    this.failureCount = 0;
    logger.info('Forced system online');
  }

  
  forceOffline() {
    this.isOnline = false;
    logger.info('Forced system offline');
  }
}

module.exports = new OfflineModeService();
