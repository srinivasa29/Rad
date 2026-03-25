/**
 * Twelve Data Service
 * Free tier: 800 API calls/day
 * Best for: Indian stocks, historical data, real-time quotes
 */

const axios = require('axios');
const logger = require('../utils/logger');

class TwelveDataService {
  constructor() {
    this.baseUrl = 'https://api.twelvedata.com';
    this.apiKey = process.env.TWELVE_DATA_API_KEY || 'demo'; // Use demo key if not set
    this.requestCount = 0;
    this.dailyLimit = 800;
    this.requestTimestamps = [];
  }

  /**
   * Check if we can make a request (daily limit)
   * @returns {boolean}
   */
  canMakeRequest() {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    // Remove timestamps older than 24 hours
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => timestamp > oneDayAgo
    );

    return this.requestTimestamps.length < this.dailyLimit;
  }

  /**
   * Record a request
   */
  recordRequest() {
    this.requestTimestamps.push(Date.now());
    this.requestCount++;
  }

  /**
   * Get real-time quote for a symbol
   * @param {string} symbol - Stock symbol (e.g., 'RELIANCE.NS')
   * @returns {Promise<Object>}
   */
  async getQuote(symbol) {
    try {
      if (!this.canMakeRequest()) {
        logger.warn('Twelve Data daily limit reached');
        return {
          success: false,
          message: 'Daily limit exceeded',
          source: 'twelvedata',
        };
      }

      // Twelve Data supports .NS suffix for NSE stocks
      const response = await axios.get(`${this.baseUrl}/quote`, {
        params: {
          symbol: symbol,
          apikey: this.apiKey,
        },
        timeout: 5000,
      });

      this.recordRequest();

      const data = response.data;

      // Check for errors
      if (data.status === 'error' || !data.close) {
        return {
          success: false,
          message: data.message || 'No data available',
          source: 'twelvedata',
        };
      }

      return {
        success: true,
        source: 'twelvedata',
        data: {
          symbol: data.symbol,
          current: parseFloat(data.close),
          high: parseFloat(data.high),
          low: parseFloat(data.low),
          open: parseFloat(data.open),
          previousClose: parseFloat(data.previous_close),
          change: parseFloat(data.change),
          changePercent: parseFloat(data.percent_change),
          timestamp: new Date(data.datetime || data.timestamp * 1000),
          volume: parseInt(data.volume),
        },
      };
    } catch (error) {
      logger.error(`Twelve Data API error for ${symbol}:`, error.message);
      return {
        success: false,
        message: error.message,
        source: 'twelvedata',
      };
    }
  }

  /**
   * Get real-time price (faster endpoint)
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>}
   */
  async getPrice(symbol) {
    try {
      if (!this.canMakeRequest()) {
        return {
          success: false,
          message: 'Daily limit exceeded',
        };
      }

      const response = await axios.get(`${this.baseUrl}/price`, {
        params: {
          symbol: symbol,
          apikey: this.apiKey,
        },
        timeout: 5000,
      });

      this.recordRequest();

      const data = response.data;

      if (data.status === 'error') {
        return {
          success: false,
          message: data.message,
        };
      }

      return {
        success: true,
        source: 'twelvedata',
        data: {
          symbol: symbol,
          price: parseFloat(data.price),
          timestamp: new Date(),
        },
      };
    } catch (error) {
      logger.error(`Twelve Data price error:`, error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get time series data
   * @param {string} symbol - Stock symbol
   * @param {string} interval - Interval (1min, 5min, 15min, 1h, 1day)
   * @param {number} outputsize - Number of data points (default: 30)
   * @returns {Promise<Object>}
   */
  async getTimeSeries(symbol, interval = '1day', outputsize = 30) {
    try {
      if (!this.canMakeRequest()) {
        return {
          success: false,
          message: 'Daily limit exceeded',
        };
      }

      const response = await axios.get(`${this.baseUrl}/time_series`, {
        params: {
          symbol: symbol,
          interval: interval,
          outputsize: outputsize,
          apikey: this.apiKey,
        },
        timeout: 10000,
      });

      this.recordRequest();

      const data = response.data;

      if (data.status === 'error') {
        return {
          success: false,
          message: data.message,
        };
      }

      // Convert to OHLC format
      const ohlcData = data.values.map(candle => ({
        timestamp: new Date(candle.datetime),
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
        volume: parseInt(candle.volume),
      }));

      return {
        success: true,
        source: 'twelvedata',
        data: ohlcData,
        meta: data.meta,
      };
    } catch (error) {
      logger.error(`Twelve Data time series error:`, error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get rate limit status
   * @returns {Object}
   */
  getRateLimitStatus() {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => timestamp > oneDayAgo
    );

    return {
      service: 'twelvedata',
      requestsInWindow: this.requestTimestamps.length,
      maxRequests: this.dailyLimit,
      remainingRequests: this.dailyLimit - this.requestTimestamps.length,
      totalRequests: this.requestCount,
      windowMs: 24 * 60 * 60 * 1000,
    };
  }

  /**
   * Test API connection
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    try {
      const result = await this.getPrice('RELIANCE.NS');
      return result.success;
    } catch (error) {
      logger.error('Twelve Data connection test failed:', error.message);
      return false;
    }
  }
}

module.exports = new TwelveDataService();
