const candleEngine = require('./candleEngine');
const logger = require('../utils/logger');

class YahooFinanceService {
  async fetchHistoricalData(symbol, interval = '1d', range = '1y', options = {}) {
    try {
      const data = await candleEngine.getHistoricalData(symbol, interval, range);
      return {
        success: true,
        count: data.length,
        data,
        symbol,
        interval,
        range
      };
    } catch (error) {
      logger.error(`Error in yahooFinanceService.fetchHistoricalData for ${symbol}: ${error.message}`);
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  }

  async fetchCustomRange(symbol, startDate, endDate, interval = '1d', options = {}) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
    
    let range = '1y';
    if (diffDays <= 5) range = '5d';
    else if (diffDays <= 30) range = '1mo';
    else if (diffDays <= 90) range = '3mo';
    else if (diffDays <= 180) range = '6mo';

    return this.fetchHistoricalData(symbol, interval, range, options);
  }

  async batchFetch(symbols, interval = '1d', range = '1y') {
    const results = {
      success: [],
      failed: []
    };

    for (const symbol of symbols) {
      try {
        const result = await this.fetchHistoricalData(symbol, interval, range);
        if (result.success && result.data.length > 0) {
          results.success.push({
            symbol,
            count: result.count,
            data: result.data
          });
        } else {
          results.failed.push({
            symbol,
            reason: result.message || 'No data available'
          });
        }
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        results.failed.push({
          symbol,
          reason: error.message
        });
      }
    }

    logger.info(`Batch fetch complete: ${results.success.length} success, ${results.failed.length} failed`);
    return results;
  }
}

module.exports = new YahooFinanceService();
