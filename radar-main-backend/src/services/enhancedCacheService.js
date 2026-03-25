/**
 * Enhanced Cache Service
 * Tiered caching with different TTLs based on data volatility
 * Cache warming and hit rate tracking
 */

const NodeCache = require('node-cache');
const logger = require('../utils/logger');

class EnhancedCacheService {
  constructor() {
    // Create separate caches for different data types
    this.caches = {
      // Volatile data (short TTL)
      quotes: new NodeCache({ 
        stdTTL: 60,           // 1 minute
        checkperiod: 10,
        useClones: false,
      }),
      
      // Semi-volatile data (medium TTL)
      ohlc: new NodeCache({
        stdTTL: 300,          // 5 minutes
        checkperiod: 30,
        useClones: false,
      }),
      
      // Stable data (long TTL)
      company: new NodeCache({
        stdTTL: 86400,        // 24 hours
        checkperiod: 3600,
        useClones: false,
      }),
      
      // Static data (very long TTL)
      symbols: new NodeCache({
        stdTTL: 604800,       // 7 days
        checkperiod: 86400,
        useClones: false,
      }),
    };

    // Statistics tracking
    this.stats = {
      hits: { quotes: 0, ohlc: 0, company: 0, symbols: 0 },
      misses: { quotes: 0, ohlc: 0, company: 0, symbols: 0 },
      sets: { quotes: 0, ohlc: 0, company: 0, symbols: 0 },
      deletes: { quotes: 0, ohlc: 0, company: 0, symbols: 0 },
    };

    // Warm-up symbols (Nifty 50)
    this.warmupSymbols = this.getNifty50Symbols();
  }

  /**
   * Get data from cache
   * @param {string} cacheType - Cache type (quotes, ohlc, company, symbols)
   * @param {string} key - Cache key
   * @returns {*} Cached value or undefined
   */
  get(cacheType, key) {
    if (!this.caches[cacheType]) {
      logger.error(`Invalid cache type: ${cacheType}`);
      return undefined;
    }

    const value = this.caches[cacheType].get(key);
    
    if (value !== undefined) {
      this.stats.hits[cacheType]++;
      logger.debug(`Cache HIT: ${cacheType}:${key}`);
      return value;
    } else {
      this.stats.misses[cacheType]++;
      logger.debug(`Cache MISS: ${cacheType}:${key}`);
      return undefined;
    }
  }

  /**
   * Set data in cache
   * @param {string} cacheType - Cache type
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Optional TTL override (seconds)
   * @returns {boolean} Success
   */
  set(cacheType, key, value, ttl = null) {
    if (!this.caches[cacheType]) {
      logger.error(`Invalid cache type: ${cacheType}`);
      return false;
    }

    try {
      const success = ttl 
        ? this.caches[cacheType].set(key, value, ttl)
        : this.caches[cacheType].set(key, value);

      if (success) {
        this.stats.sets[cacheType]++;
        logger.debug(`Cache SET: ${cacheType}:${key} (TTL: ${ttl || 'default'})`);
      }

      return success;
    } catch (error) {
      logger.error(`Error setting cache: ${error.message}`);
      return false;
    }
  }

  /**
   * Delete data from cache
   * @param {string} cacheType - Cache type
   * @param {string} key - Cache key
   * @returns {number} Number of deleted entries
   */
  delete(cacheType, key) {
    if (!this.caches[cacheType]) {
      logger.error(`Invalid cache type: ${cacheType}`);
      return 0;
    }

    const deleted = this.caches[cacheType].del(key);
    if (deleted > 0) {
      this.stats.deletes[cacheType] += deleted;
      logger.debug(`Cache DELETE: ${cacheType}:${key}`);
    }

    return deleted;
  }

  /**
   * Clear all caches
   * @param {string} cacheType - Optional cache type to clear (clears all if not specified)
   */
  clear(cacheType = null) {
    if (cacheType) {
      if (this.caches[cacheType]) {
        this.caches[cacheType].flushAll();
        logger.info(`Cleared ${cacheType} cache`);
      }
    } else {
      Object.keys(this.caches).forEach(type => {
        this.caches[type].flushAll();
      });
      logger.info('Cleared all caches');
    }
  }

  /**
   * Warm up cache with popular symbols
   * @param {Function} dataFetcher - Function to fetch data for warming
   * @returns {Promise<Object>}
   */
  async warmCache(dataFetcher) {
    if (!dataFetcher) {
      logger.warn('No data fetcher provided for cache warming');
      return { success: false, message: 'No data fetcher' };
    }

    logger.info('Starting cache warm-up for Nifty 50 symbols...');
    const startTime = Date.now();
    let successCount = 0;
    let failCount = 0;

    for (const symbol of this.warmupSymbols) {
      try {
        const data = await dataFetcher(symbol);
        if (data) {
          // Cache the data (typically quotes or OHLC)
          this.set('quotes', symbol, data, 300); // 5 min for warm-up data
          successCount++;
        } else {
          failCount++;
        }
        
        // Small delay between requests
        await this.sleep(100);
      } catch (error) {
        logger.error(`Error warming cache for ${symbol}:`, error.message);
        failCount++;
      }
    }

    const duration = Date.now() - startTime;
    logger.info(`Cache warm-up completed: ${successCount}/${this.warmupSymbols.length} symbols in ${Math.round(duration / 1000)}s`);

    return {
      success: true,
      symbolsWarmed: successCount,
      failed: failCount,
      duration,
    };
  }

  /**
   * Get cache statistics
   * @returns {Object}
   */
  getStats() {
    const stats = {
      caches: {},
      overall: {
        totalHits: 0,
        totalMisses: 0,
        totalSets: 0,
        totalDeletes: 0,
        hitRate: '0%',
      },
    };

    // Per-cache statistics
    Object.keys(this.caches).forEach(cacheType => {
      const cache = this.caches[cacheType];
      const hits = this.stats.hits[cacheType];
      const misses = this.stats.misses[cacheType];
      const total = hits + misses;
      const hitRate = total > 0 ? ((hits / total) * 100).toFixed(1) : '0';

      stats.caches[cacheType] = {
        hits,
        misses,
        sets: this.stats.sets[cacheType],
        deletes: this.stats.deletes[cacheType],
        hitRate: `${hitRate}%`,
        keys: cache.keys().length,
        ttl: cache.options.stdTTL,
      };

      // Add to overall totals
      stats.overall.totalHits += hits;
      stats.overall.totalMisses += misses;
      stats.overall.totalSets += this.stats.sets[cacheType];
      stats.overall.totalDeletes += this.stats.deletes[cacheType];
    });

    // Calculate overall hit rate
    const totalRequests = stats.overall.totalHits + stats.overall.totalMisses;
    stats.overall.hitRate = totalRequests > 0 
      ? `${((stats.overall.totalHits / totalRequests) * 100).toFixed(1)}%`
      : '0%';

    return stats;
  }

  /**
   * Get cache keys for a specific cache type
   * @param {string} cacheType - Cache type
   * @returns {Array<string>}
   */
  getKeys(cacheType) {
    if (!this.caches[cacheType]) {
      return [];
    }
    return this.caches[cacheType].keys();
  }

  /**
   * Get cache size (number of keys)
   * @param {string} cacheType - Cache type
   * @returns {number}
   */
  getSize(cacheType) {
    if (!this.caches[cacheType]) {
      return 0;
    }
    return this.caches[cacheType].keys().length;
  }

  /**
   * Reset statistics
   */
  resetStats() {
    Object.keys(this.stats.hits).forEach(key => {
      this.stats.hits[key] = 0;
      this.stats.misses[key] = 0;
      this.stats.sets[key] = 0;
      this.stats.deletes[key] = 0;
    });
    logger.info('Cache statistics reset');
  }

  /**
   * Get Nifty 50 symbols for warming
   * @returns {Array<string>}
   */
  getNifty50Symbols() {
    return [
      'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
      'HINDUNILVR', 'ITC', 'SBIN', 'BHARTIARTL', 'KOTAKBANK',
      'LT', 'AXISBANK', 'ASIANPAINT', 'MARUTI', 'HCLTECH',
      'BAJFINANCE', 'WIPRO', 'ULTRACEMCO', 'TITAN', 'NESTLEIND',
    ];
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new EnhancedCacheService();
