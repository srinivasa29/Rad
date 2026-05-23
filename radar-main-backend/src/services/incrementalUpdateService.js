

const ohlcService = require('./ohlcService');
const yahooFinanceService = require('./yahooFinanceService');
const marketHoursService = require('./marketHoursService');
const logger = require('../utils/logger');
const Symbol = require('../models/Symbol');
const OHLC = require('../models/OHLC');

// Crypto symbols must never be sent to Yahoo Finance with .NS suffix
const CRYPTO_SYMBOLS = new Set([
    'BTC','ETH','SOL','XRP','BNB','ADA','DOT','DOGE','MATIC','LINK',
    'AVAX','ATOM','LTC','UNI','SHIB','TRX','ETC','FIL','NEAR','APT',
    'ARB','OP','INJ','SUI','SEI','PEPE','WIF','TON','FLOKI','BONK',
]);
const isCrypto = (s) => {
    const clean = String(s || '').toUpperCase().replace(/USDT$/i, '').replace(/\.(NS|BO)$/i, '');
    return CRYPTO_SYMBOLS.has(clean) || String(s).toUpperCase().endsWith('USDT');
};

class IncrementalUpdateService {
  constructor() {
    this.isRunning = false;
    this.lastUpdateTime = new Date();
    this.updateCount = 0;
    this.errorCount = 0;
    this.stats = {
      totalUpdates: 0,
      successfulUpdates: 0,
      failedUpdates: 0,
      symbolsUpdated: 0,
      avgTimePerSymbol: 0,
    };
  }

  
  /**
   * Fetch active stock symbols from the database.
   * Falls back to OHLC distinct symbols, then a minimal hardcoded seed list.
   */
  async fetchSymbolsFromDB() {
    try {
      // Primary: Symbol collection – active equities/ETFs on NSE
      const dbSymbols = await Symbol.find(
        { active: true, assetType: { $in: ['equity', 'etf'] }, exchange: { $in: ['NSE', 'BSE', 'UNKNOWN'] } },
        { symbol: 1, _id: 0 }
      ).lean();

      if (dbSymbols.length > 0) {
        const symbols = dbSymbols.map(s => s.symbol.replace(/\.(NS|BO)$/i, ''));
        logger.info(`fetchSymbolsFromDB: ${symbols.length} symbols from Symbol collection`);
        return symbols;
      }

      // Fallback: distinct symbols already in OHLC collection
      const ohlcSymbols = await OHLC.distinct('symbol', { exchange: { $in: ['NSE', 'BSE'] } });
      if (ohlcSymbols.length > 0) {
        logger.info(`fetchSymbolsFromDB: ${ohlcSymbols.length} symbols from OHLC collection`);
        return ohlcSymbols.map(s => s.replace(/\.(NS|BO)$/i, ''));
      }

      // Last resort: minimal seed list
      logger.warn('fetchSymbolsFromDB: No symbols in DB – using seed list');
      return [
        'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
        'SBIN', 'ITC', 'LT', 'AXISBANK', 'KOTAKBANK',
      ];
    } catch (err) {
      logger.error(`fetchSymbolsFromDB error: ${err.message}`);
      return [];
    }
  }

  async updateAllSymbols(options = {}) {
    const {
      symbols: optionSymbols,
      timeframe = '1d',
      force = false,
    } = options;

    // Resolve symbols: use caller-supplied list or query the DB
    const symbols = (Array.isArray(optionSymbols) && optionSymbols.length > 0)
      ? optionSymbols
      : await this.fetchSymbolsFromDB();

    if (!force && !marketHoursService.isPostMarket()) {
      logger.info('Active market hours - skipping heavy incremental backfill');
      return {
        success: true,
        message: 'Active market hours - no heavy backfill needed',
        skipped: true,
        marketStatus: marketHoursService.getMarketStatus(),
      };
    }

    if (this.isRunning) {
      logger.warn('Incremental update already in progress');
      return {
        success: false,
        message: 'Update already in progress',
      };
    }

    this.isRunning = true;
    const startTime = Date.now();
    const results = [];

    logger.info(`Starting incremental update for ${symbols.length} symbols`, {
      timeframe,
      marketOpen: marketHoursService.isNSEOpen(),
    });

    try {
      for (const symbol of symbols) {
        try {
          const result = await this.updateSymbol(symbol, timeframe);
          results.push(result);
          
          await this.sleep(300);
        } catch (error) {
          logger.error(`Failed to update symbol ${symbol}: ${error.message}`);
          results.push({
            symbol,
            success: false,
            error: error.message,
          });
          this.errorCount++;
        }
      }

      const successCount = results.filter(r => r.success).length;
      const newCandlesCount = results.reduce((sum, r) => sum + (r.newCandles || 0), 0);
      const totalTime = Date.now() - startTime;

      this.stats.totalUpdates++;
      this.stats.successfulUpdates += successCount;
      this.stats.failedUpdates += (results.length - successCount);
      this.stats.symbolsUpdated = symbols.length;
      this.stats.avgTimePerSymbol = Math.round(totalTime / symbols.length);

      logger.info('Incremental update completed', {
        success: successCount,
        failed: results.length - successCount,
        newCandles: newCandlesCount,
        totalTime: `${Math.round(totalTime / 1000)}s`,
        avgPerSymbol: `${this.stats.avgTimePerSymbol}ms`,
      });

      this.lastUpdateTime = new Date();
      this.updateCount++;

      return {
        success: true,
        symbolsProcessed: results.length,
        successCount,
        failedCount: results.length - successCount,
        newCandles: newCandlesCount,
        totalTime,
        results,
        stats: this.getStats(),
      };
    } finally {
      this.isRunning = false;
    }
  }

  
  async updateSymbol(symbol, timeframe = '1d') {
    try {
      const lastCandleResult = await ohlcService.getLatest(symbol, timeframe);
      const lastCandle = lastCandleResult?.data;
      
      let startDate;
      if (lastCandle) {
        startDate = new Date(lastCandle.timestamp);
        startDate.setDate(startDate.getDate() + 1);
      } else {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
      }

      const endDate = new Date();

      const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
      if (daysDiff < 0) {
        return {
          symbol,
          success: true,
          newCandles: 0,
          message: 'No new data needed',
        };
      }

      // Skip crypto — their OHLC is backfilled via Binance, not Yahoo
      if (isCrypto(symbol)) {
        return { symbol, success: true, newCandles: 0, message: 'Crypto symbol — skipped (use Binance)' };
      }

      const symbolWithSuffix = symbol.endsWith('.NS') || symbol.endsWith('.BO')
        ? symbol
        : `${symbol}.NS`; // NSE suffix for Indian equities only
      const response = await yahooFinanceService.fetchCustomRange(
        symbolWithSuffix,
        startDate,
        endDate,
        timeframe
      );

      const newData = response.data;

      if (!newData || newData.length === 0) {
        return {
          symbol,
          success: true,
          newCandles: 0,
          message: 'No new data available',
        };
      }

      const cleanSym = symbol.toUpperCase().replace(/\.(NS|BO)$/i, '');
      const timestamps = newData.map(c => new Date(c.timestamp || (c.time * 1000)));
      const minDate = new Date(Math.min(...timestamps.map(t => t.getTime())));
      const maxDate = new Date(Math.max(...timestamps.map(t => t.getTime())));

      // Fetch existing candles in this range to avoid duplicates in timeseries
      const existingDocs = await OHLC.find({
        symbol: cleanSym,
        exchange: 'NSE',
        timeframe,
        timestamp: { $gte: minDate, $lte: maxDate }
      }).select('timestamp').lean();

      const existingTimes = new Set(existingDocs.map(d => new Date(d.timestamp).getTime()));
      const newDocs = [];

      for (const c of newData) {
        const ts = new Date(c.timestamp || (c.time * 1000));
        if (!existingTimes.has(ts.getTime())) {
          newDocs.push({
            timestamp: ts,
            symbol: cleanSym,
            exchange: 'NSE',
            timeframe,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: c.volume || 0,
            source: 'yahoo',
          });
        }
      }

      if (newDocs.length > 0) {
        await OHLC.insertMany(newDocs, { ordered: false });
        logger.info(`Updated ${symbol}: Saved ${newDocs.length} new candles to DB`);
      } else {
        logger.info(`Updated ${symbol}: No new candles needed`);
      }

      return {
        symbol,
        success: true,
        newCandles: newDocs.length,
        latestDate: newData[newData.length - 1].timestamp || new Date(newData[newData.length - 1].time * 1000).toISOString(),
      };
    } catch (error) {
      logger.error(`Error updating symbol ${symbol}: ${error.message}`);
      return {
        symbol,
        success: false,
        error: error.message,
      };
    }
  }

  
  async updateSpecificSymbols(symbols, timeframe = '1d') {
    return this.updateAllSymbols({ symbols, timeframe, force: true });
  }

  
  async forceUpdate(options = {}) {
    return this.updateAllSymbols({ ...options, force: true });
  }

  
  getStats() {
    return {
      ...this.stats,
      lastUpdateTime: this.lastUpdateTime,
      updateCount: this.updateCount,
      errorCount: this.errorCount,
      isRunning: this.isRunning,
      uptime: process.uptime(),
    };
  }

  
  resetStats() {
    this.stats = {
      totalUpdates: 0,
      successfulUpdates: 0,
      failedUpdates: 0,
      symbolsUpdated: 0,
      avgTimePerSymbol: 0,
    };
    this.updateCount = 0;
    this.errorCount = 0;
  }

  
  isUpdateNeeded(intervalMinutes = 5) {
    const now = new Date();
    const minutesSinceLastUpdate = (now - this.lastUpdateTime) / (1000 * 60);
    return minutesSinceLastUpdate >= intervalMinutes;
  }

  
  /** @deprecated Use fetchSymbolsFromDB() instead */
  async getNifty50Symbols() {
    // Delegate to the DB-backed method so this legacy shim stays dynamic
    return this.fetchSymbolsFromDB();
  }

  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new IncrementalUpdateService();
