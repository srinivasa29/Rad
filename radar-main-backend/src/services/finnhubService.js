/**
 * Finnhub Service
 * Free tier: 60 API calls/minute
 * Best for: Real-time quotes, company info
 */

const axios = require('axios');
const logger = require('../utils/logger');

class FinnhubService {
  constructor() {
    this.baseUrl = 'https://finnhub.io/api/v1';
    this.apiKey = process.env.FINNHUB_API_KEY || 'demo'; // Use demo key if not set
    this.requestCount = 0;
    this.requestWindow = 60000; // 1 minute
    this.maxRequestsPerWindow = 60;
    this.requestTimestamps = [];
  }

  /**
   * Check if we can make a request (rate limiting)
   * @returns {boolean}
   */
  canMakeRequest() {
    const now = Date.now();
    // Remove timestamps older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.requestWindow
    );

    return this.requestTimestamps.length < this.maxRequestsPerWindow;
  }

  /**
   * Record a request for rate limiting
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
        logger.warn('Finnhub rate limit reached, skipping request');
        return {
          success: false,
          message: 'Rate limit exceeded',
          source: 'finnhub',
        };
      }

      // Convert Indian symbols to Finnhub format
      const finnhubSymbol = this.convertToFinnhubSymbol(symbol);

      const response = await axios.get(`${this.baseUrl}/quote`, {
        params: {
          symbol: finnhubSymbol,
          token: this.apiKey,
        },
        timeout: 5000,
      });

      this.recordRequest();

      const data = response.data;

      // Check if valid data returned
      if (!data || data.c === 0) {
        return {
          success: false,
          message: 'No data available for symbol',
          source: 'finnhub',
        };
      }

      return {
        success: true,
        source: 'finnhub',
        data: {
          symbol: symbol,
          current: data.c,  // Current price
          high: data.h,     // High price of the day
          low: data.l,      // Low price of the day
          open: data.o,     // Open price of the day
          previousClose: data.pc, // Previous close
          change: data.d,   // Change
          changePercent: data.dp, // Percent change
          timestamp: new Date(data.t * 1000), // Convert Unix to Date
          volume: null, // Not provided in quote endpoint
        },
      };
    } catch (error) {
      logger.error(`Finnhub API error for ${symbol}:`, error.message);
      return {
        success: false,
        message: error.message,
        source: 'finnhub',
      };
    }
  }

  /**
   * Get company profile
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>}
   */
  async getCompanyProfile(symbol) {
    try {
      if (!this.canMakeRequest()) {
        return {
          success: false,
          message: 'Rate limit exceeded',
        };
      }

      const finnhubSymbol = this.convertToFinnhubSymbol(symbol);

      const response = await axios.get(`${this.baseUrl}/stock/profile2`, {
        params: {
          symbol: finnhubSymbol,
          token: this.apiKey,
        },
        timeout: 5000,
      });

      this.recordRequest();

      return {
        success: true,
        source: 'finnhub',
        data: response.data,
      };
    } catch (error) {
      logger.error(`Finnhub company profile error:`, error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Convert symbol to Finnhub format
   * @param {string} symbol - Original symbol
   * @returns {string}
   */
  convertToFinnhubSymbol(symbol) {
    // Remove .NS/.BO suffix for Indian stocks
    // Finnhub doesn't support Indian markets well, so this might not work
    // For demo purposes, we'll keep the format
    return symbol.replace('.NS', '').replace('.BO', '');
  }

  /**
   * Get rate limit status
   * @returns {Object}
   */
  getRateLimitStatus() {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.requestWindow
    );

    return {
      service: 'finnhub',
      requestsInWindow: this.requestTimestamps.length,
      maxRequests: this.maxRequestsPerWindow,
      remainingRequests: this.maxRequestsPerWindow - this.requestTimestamps.length,
      totalRequests: this.requestCount,
      windowMs: this.requestWindow,
    };
  }

  /**
   * Test API connection
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    try {
      const result = await this.getQuote('AAPL');
      return result.success;
    } catch (error) {
      logger.error('Finnhub connection test failed:', error.message);
      return false;
    }
  }
}

module.exports = new FinnhubService();
