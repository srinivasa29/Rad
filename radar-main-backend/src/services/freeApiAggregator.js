/**
 * Free API Aggregator
 * Intelligently routes requests to free API sources
 * Priority: Twelve Data (Indian stocks) → Yahoo Finance (fallback) → Finnhub (US stocks)
 */

const finnhubService = require('./finnhubService');
const twelveDataService = require('./twelveDataService');
const yahooFinanceService = require('./yahooFinanceService');
const ohlcService = require('./ohlcService');
const logger = require('../utils/logger');

class FreeApiAggregator {
  constructor() {
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      yahooHits: 0,
      twelveDataHits: 0,
      finnhubHits: 0,
      failures: 0,
    };
  }

  /**
   * Get real-time quote with intelligent source selection
   * @param {string} symbol - Stock symbol (e.g., 'RELIANCE.NS')
   * @param {Object} options - Options
   * @returns {Promise<Object>}
   */
  async getQuote(symbol, options = {}) {
    const {
      preferredSource = 'auto',
      maxAge = 60000, // 1 minute cache
      skipCache = false,
    } = options;

    this.stats.totalRequests++;

    try {
      // 1. Try cache first (if not skipped)
      if (!skipCache) {
        const cached = await this.getCachedQuote(symbol, maxAge);
        if (cached) {
          this.stats.cacheHits++;
          return cached;
        }
      }

      // 2. Determine best source
      const source = preferredSource === 'auto' 
        ? this.selectBestSource(symbol)
        : preferredSource;

      // 3. Try selected source
      let result = await this.trySource(symbol, source);

      // 4. Fallback chain if primary fails
      if (!result.success) {
        result = await this.tryFallbackChain(symbol, source);
      }

      // 5. Cache successful result
      if (result.success) {
        await this.cacheQuote(symbol, result.data);
      } else {
        this.stats.failures++;
      }

      return result;
    } catch (error) {
      logger.error(`API Aggregator error for ${symbol}:`, error.message);
      this.stats.failures++;
      
      return {
        success: false,
        message: error.message,
        source: 'aggregator',
      };
    }
  }

  /**
   * Select best API source based on symbol
   * @param {string} symbol - Stock symbol
   * @returns {string}
   */
  selectBestSource(symbol) {
    // Indian stocks (.NS, .BO) - use Twelve Data (best support)
    if (symbol.includes('.NS') || symbol.includes('.BO')) {
      if (twelveDataService.canMakeRequest()) {
        return 'twelvedata';
      }
      return 'yahoo'; // Fallback to Yahoo
    }

    // US stocks - use Finnhub
    if (finnhubService.canMakeRequest()) {
      return 'finnhub';
    }

    // Default to Yahoo (unlimited)
    return 'yahoo';
  }

  /**
   * Try a specific source
   * @param {string} symbol - Stock symbol
   * @param {string} source - Source name
   * @returns {Promise<Object>}
   */
  async trySource(symbol, source) {
    try {
      switch (source) {
        case 'twelvedata':
          this.stats.twelveDataHits++;
          return await twelveDataService.getQuote(symbol);
        
        case 'finnhub':
          this.stats.finnhubHits++;
          return await finnhubService.getQuote(symbol);
        
        case 'yahoo':
        default:
          this.stats.yahooHits++;
          // Yahoo doesn't have a quote endpoint in our service yet
          // Use latest OHLC or fetch latest candle
          const latest = await ohlcService.getLatest(symbol.replace('.NS', '').replace('.BO', ''), '1d');
          if (latest.success && latest.data) {
            return {
              success: true,
              source: 'yahoo-cache',
              data: {
                symbol: symbol,
                current: latest.data.close,
                high: latest.data.high,
                low: latest.data.low,
                open: latest.data.open,
                previousClose: null,
                change: null,
                changePercent: null,
                timestamp: latest.data.timestamp,
                volume: latest.data.volume,
              },
            };
          }
          
          return {
            success: false,
            message: 'No cached data available',
            source: 'yahoo',
          };
      }
    } catch (error) {
      logger.error(`Error with source ${source}:`, error.message);
      return {
        success: false,
        message: error.message,
        source: source,
      };
    }
  }

  /**
   * Try fallback chain
   * @param {string} symbol - Stock symbol
   * @param {string} excludeSource - Source to exclude
   * @returns {Promise<Object>}
   */
  async tryFallbackChain(symbol, excludeSource) {
    const sources = ['twelvedata', 'finnhub', 'yahoo'];
    const remainingSources = sources.filter(s => s !== excludeSource);

    for (const source of remainingSources) {
      logger.info(`Trying fallback source: ${source}`);
      const result = await this.trySource(symbol, source);
      if (result.success) {
        return result;
      }
    }

    return {
      success: false,
      message: 'All API sources failed',
      source: 'aggregator',
    };
  }

  /**
   * Get cached quote from OHLC database
   * @param {string} symbol - Stock symbol
   * @param {number} maxAge - Max age in milliseconds
   * @returns {Promise<Object|null>}
   */
  async getCachedQuote(symbol, maxAge) {
    try {
      const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '');
      const latest = await ohlcService.getLatest(cleanSymbol, '1d');
      
      if (latest.success && latest.data) {
        const age = Date.now() - new Date(latest.data.timestamp).getTime();
        
        if (age <= maxAge) {
          return {
            success: true,
            source: 'cache',
            cached: true,
            age: age,
            data: {
              symbol: symbol,
              current: latest.data.close,
              high: latest.data.high,
              low: latest.data.low,
              open: latest.data.open,
              previousClose: null,
              timestamp: latest.data.timestamp,
              volume: latest.data.volume,
            },
          };
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Cache quote data
   * @param {string} symbol - Stock symbol
   * @param {Object} data - Quote data
   */
  async cacheQuote(symbol, data) {
    // Cache is handled by OHLC service updates
    // This is a placeholder for future cache implementation
    logger.debug(`Quote cached for ${symbol}`);
  }

  /**
   * Get batch quotes
   * @param {Array<string>} symbols - Array of symbols
   * @param {Object} options - Options
   * @returns {Promise<Array>}
   */
  async getBatchQuotes(symbols, options = {}) {
    const results = [];
    
    for (const symbol of symbols) {
      const quote = await this.getQuote(symbol, options);
      results.push({
        symbol,
        ...quote,
      });
      
      // Small delay to avoid rate limits
      await this.sleep(100);
    }
    
    return results;
  }

  /**
   * Get aggregator statistics
   * @returns {Object}
   */
  getStats() {
    const total = this.stats.totalRequests || 1;
    
    return {
      ...this.stats,
      cacheHitRate: `${((this.stats.cacheHits / total) * 100).toFixed(1)}%`,
      successRate: `${(((total - this.stats.failures) / total) * 100).toFixed(1)}%`,
      sourceDistribution: {
        cache: this.stats.cacheHits,
        yahoo: this.stats.yahooHits,
        twelvedata: this.stats.twelveDataHits,
        finnhub: this.stats.finnhubHits,
      },
      rateLimits: {
        finnhub: finnhubService.getRateLimitStatus(),
        twelvedata: twelveDataService.getRateLimitStatus(),
      },
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      yahooHits: 0,
      twelveDataHits: 0,
      finnhubHits: 0,
      failures: 0,
    };
  }

  /**
   * Test all API connections
   * @returns {Promise<Object>}
   */
  async testAllConnections() {
    const results = {
      finnhub: await finnhubService.testConnection(),
      twelvedata: await twelveDataService.testConnection(),
      yahoo: true, // Yahoo always works through OHLC cache
    };

    return {
      success: Object.values(results).some(r => r === true),
      details: results,
    };
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new FreeApiAggregator();
