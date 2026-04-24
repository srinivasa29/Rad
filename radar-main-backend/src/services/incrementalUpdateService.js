

const ohlcService = require('./ohlcService');
const yahooFinanceService = require('./yahooFinanceService');
const marketHoursService = require('./marketHoursService');
const logger = require('../utils/logger');

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

  
  async updateAllSymbols(options = {}) {
    const {
      symbols = this.getNifty50Symbols(),
      timeframe = '1d',
      force = false,
    } = options;

    if (!force && !marketHoursService.shouldFetchUpdates()) {
      logger.info('Market closed - skipping incremental update');
      return {
        success: true,
        message: 'Market closed - no update needed',
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
          logger.error(`Failed to update symbol ${symbol}:`, error.message);
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

      const symbolWithSuffix = `${symbol}.NS`; // NSE suffix
      const newData = await yahooFinanceService.fetchHistoricalData(
        symbolWithSuffix,
        timeframe,
        startDate,
        endDate
      );

      if (!newData || newData.length === 0) {
        return {
          symbol,
          success: true,
          newCandles: 0,
          message: 'No new data available',
        };
      }

      const savePromises = newData.map(candle => 
        ohlcService.saveOHLC({
          ...candle,
          symbol, // Remove .NS suffix for storage
          exchange: 'NSE',
          timeframe,
          source: 'yahoo',
        })
      );

      await Promise.all(savePromises);

      logger.info(`Updated ${symbol}: ${newData.length} new candles`);

      return {
        symbol,
        success: true,
        newCandles: newData.length,
        latestDate: newData[newData.length - 1].timestamp,
      };
    } catch (error) {
      logger.error(`Error updating symbol ${symbol}:`, error.message);
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

  
  getNifty50Symbols() {
    return [
      'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
      'HINDUNILVR', 'ITC', 'SBIN', 'BHARTIARTL', 'KOTAKBANK',
      'LT', 'AXISBANK', 'ASIANPAINT', 'MARUTI', 'HCLTECH',
      'BAJFINANCE', 'WIPRO', 'ULTRACEMCO', 'TITAN', 'NESTLEIND',
      'SUNPHARMA', 'TECHM', 'ONGC', 'NTPC', 'POWERGRID',
      'M&M', 'TATASTEEL', 'ADANIPORTS', 'BAJAJFINSV', 'JSWSTEEL',
      'INDUSINDBK', 'TATAMOTORS', 'HINDALCO', 'DIVISLAB', 'COALINDIA',
      'DRREDDY', 'EICHERMOT', 'CIPLA', 'GRASIM', 'BRITANNIA',
      'HEROMOTOCO', 'SHREECEM', 'APOLLOHOSP', 'UPL', 'BPCL',
      'TATACONSUM', 'SBILIFE', 'ADANIENT', 'HDFCLIFE', 'BAJAJ-AUTO',
    ];
  }

  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new IncrementalUpdateService();
