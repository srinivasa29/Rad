

const finnhubService = require('./finnhubService');
const twelveDataService = require('./twelveDataService');
const yahooFinanceService = require('./yahooFinanceService');
const ohlcService = require('./ohlcService');
const cryptoService = require('./cryptoService');
const logger = require('../utils/logger');
const redisClient = require('./redisClient');
const symbolAdapter = require('../utils/symbolAdapter');

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

  
  async getQuote(symbol, options = {}) {
    const {
      preferredSource = 'auto',
      maxAge = 60000, // 1 minute cache
      skipCache = false,
    } = options;

    this.stats.totalRequests++;

    const redisKey = `quote:${symbol.toUpperCase()}`;

    try {
      if (!skipCache) {
        // Try Redis cache first
        try {
          const redisCached = await redisClient.get(redisKey);
          if (redisCached) {
            logger.debug(`[Quote Aggregator] Redis cache hit for key: ${redisKey}`);
            this.stats.cacheHits++;
            return {
              success: true,
              source: 'redis',
              cached: true,
              data: redisCached
            };
          }
        } catch (cacheErr) {
          logger.warn(`[Quote Aggregator Cache Error] Redis error: ${cacheErr.message}`);
        }

        const cached = await this.getCachedQuote(symbol, maxAge);
        if (cached) {
          this.stats.cacheHits++;
          return cached;
        }
      }

      const source = preferredSource === 'auto' 
        ? this.selectBestSource(symbol)
        : preferredSource;

      let result = await this.trySource(symbol, source);

      if (!result.success) {
        result = await this.tryFallbackChain(symbol, source);
      }

      if (result.success) {
        await this.cacheQuote(symbol, result.data);
        // Save to Redis (cache for min of 15 seconds or maxAge)
        try {
          const ttl = Math.max(15000, maxAge);
          await redisClient.set(redisKey, result.data, ttl);
          logger.debug(`[Quote Aggregator Cache Save] Saved quote to Redis for ${symbol}`);
        } catch (cacheErr) {
          logger.warn(`[Quote Aggregator Cache Save Error] Failed to save quote to Redis: ${cacheErr.message}`);
        }
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

  
  selectBestSource(symbol) {
    const s = String(symbol || '').toUpperCase().replace(/USDT$/i, '').replace(/-USD$/i, '');
    const CRYPTO_SYMBOLS = new Set(['BTC','ETH','SOL','XRP','BNB','ADA','DOT','DOGE','MATIC','LINK','AVAX','ATOM','LTC','UNI','SHIB','TRX','ETC','FIL','NEAR','APT','ARB','OP','INJ','SUI','SEI','PEPE','WIF','TON','FLOKI','BONK']);
    
    if (CRYPTO_SYMBOLS.has(s) || symbol.toUpperCase().endsWith('USDT')) {
      return 'binance';
    }

    // Default to Yahoo Finance as the primary source for all equities (free, unlimited, stable)
    return 'yahoo';
  }

  
  async trySource(symbol, source) {
    try {
      switch (source) {
        case 'binance':
          try {
            const data = await cryptoService.fetchCryptoBySymbol(symbol);
            if (data) {
              return {
                success: true,
                source: 'binance',
                data: {
                  symbol: symbol,
                  current: data.current_price,
                  high: data.high_24h,
                  low: data.low_24h,
                  open: data.open,
                  previousClose: data.prev_close,
                  change: data.price_change_24h,
                  changePercent: data.price_change_percentage_24h,
                  timestamp: new Date(),
                  volume: data.total_volume,
                  tradeCount: data.trade_count,
                  category: data.category,
                  layer: data.layer,
                  consensus: data.consensus
                },
              };
            }
          } catch (e) {
            logger.error(`Binance fetch failed for ${symbol}:`, e.message);
          }
          return { success: false, message: 'Binance fetch failed', source: 'binance' };

        case 'twelvedata':
          this.stats.twelveDataHits++;
          return await twelveDataService.getQuote(symbol);
        
        case 'finnhub':
          this.stats.finnhubHits++;
          return await finnhubService.getQuote(symbol);
        
        case 'yahoo':
        default:
          this.stats.yahooHits++;
          try {
            const YahooFinance = require('yahoo-finance2').default;
            const yahooFinance = new YahooFinance();
            const yahooSymbol = symbolAdapter.toYahoo(symbol);
            const yfQuote = await yahooFinance.quote(yahooSymbol);
            if (yfQuote) {
              return {
                success: true,
                source: 'yahoo',
                data: {
                  symbol: symbol,
                  current: yfQuote.regularMarketPrice,
                  high: yfQuote.regularMarketDayHigh || yfQuote.regularMarketPrice,
                  low: yfQuote.regularMarketDayLow || yfQuote.regularMarketPrice,
                  open: yfQuote.regularMarketOpen || yfQuote.regularMarketPrice,
                  previousClose: yfQuote.regularMarketPreviousClose,
                  change: yfQuote.regularMarketChange,
                  changePercent: yfQuote.regularMarketChangePercent,
                  timestamp: new Date(yfQuote.regularMarketTime || Date.now()),
                  volume: yfQuote.regularMarketVolume,
                  marketCap: yfQuote.marketCap,
                  eps: yfQuote.epsTrailingTwelveMonths || yfQuote.epsForward,
                  dividendYield: yfQuote.dividendYield,
                  name: yfQuote.longName || yfQuote.shortName || symbol
                }
              };
            }
          } catch (yfErr) {
            logger.warn(`Yahoo Finance quote API failed for ${symbol} (formatted: ${symbolAdapter.toYahoo(symbol)}): ${yfErr.message}`);
          }

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

  
  async cacheQuote(symbol, data) {
    logger.debug(`Quote cached for ${symbol}`);
  }

  
  async getBatchQuotes(symbols, options = {}) {
    const results = [];
    
    for (const symbol of symbols) {
      const quote = await this.getQuote(symbol, options);
      results.push({
        symbol,
        ...quote,
      });
      
      await this.sleep(100);
    }
    
    return results;
  }

  
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

  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new FreeApiAggregator();
