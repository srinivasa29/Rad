import api from './api';

/**
 * OHLC API - Historical market data from MongoDB time-series collection
 * This provides much faster access to historical data compared to external APIs
 * Data is pre-loaded and stored locally in the database
 */

/**
 * Get historical OHLC data for a symbol
 * @param {string} symbol - Stock symbol (e.g., 'RELIANCE', 'TCS')
 * @param {object} options - Query options
 * @param {string} options.exchange - Exchange (NSE, BSE) - default: 'NSE'
 * @param {string} options.timeframe - Timeframe (1d, 1h, 15m, 5m) - default: '1d'
 * @param {string} options.startDate - Start date (ISO string)
 * @param {string} options.endDate - End date (ISO string)
 * @param {number} options.limit - Max records to return - default: 365
 * @returns {Promise} OHLC data array
 */
export const fetchOHLCData = async (symbol, options = {}) => {
    try {
        const {
            exchange = 'NSE',
            timeframe = '1d',
            startDate,
            endDate,
            limit = 365,
        } = options;

        // Remove .NS or .BO suffix if present
        const cleanSymbol = symbol.replace(/\.(NS|BO)$/i, '');

        const params = {
            exchange,
            timeframe,
            limit,
        };

        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const response = await api.get(`/ohlc/${cleanSymbol}`, { params });

        if (!response.data?.success) {
            throw new Error(response.data?.message || 'Failed to fetch OHLC data');
        }

        return {
            symbol: cleanSymbol,
            exchange,
            timeframe,
            count: response.data.count,
            data: response.data.data || [],
        };
    } catch (error) {
        console.error(`Error fetching OHLC data for ${symbol}:`, error);
        
        // Return empty data structure on error
        return {
            symbol,
            exchange: options.exchange || 'NSE',
            timeframe: options.timeframe || '1d',
            count: 0,
            data: [],
            error: error.message,
        };
    }
};

/**
 * Get latest OHLC candle for a symbol
 * @param {string} symbol - Stock symbol
 * @param {object} options - Query options
 * @param {string} options.exchange - Exchange (NSE, BSE) - default: 'NSE'
 * @param {string} options.timeframe - Timeframe (1d, 1h, 15m, 5m) - default: '1d'
 * @returns {Promise} Latest OHLC candle
 */
export const fetchLatestOHLC = async (symbol, options = {}) => {
    try {
        const {
            exchange = 'NSE',
            timeframe = '1d',
        } = options;

        const cleanSymbol = symbol.replace(/\.(NS|BO)$/i, '');

        const response = await api.get(`/ohlc/${cleanSymbol}/latest`, {
            params: { exchange, timeframe },
        });

        if (!response.data?.success) {
            throw new Error(response.data?.message || 'Failed to fetch latest OHLC');
        }

        return {
            symbol: cleanSymbol,
            exchange,
            timeframe,
            data: response.data.data,
        };
    } catch (error) {
        console.error(`Error fetching latest OHLC for ${symbol}:`, error);
        return {
            symbol,
            exchange: options.exchange || 'NSE',
            timeframe: options.timeframe || '1d',
            data: null,
            error: error.message,
        };
    }
};

/**
 * Get list of available symbols with OHLC data
 * @param {string} exchange - Filter by exchange (optional)
 * @returns {Promise} Array of symbols
 */
export const fetchAvailableOHLCSymbols = async (exchange = null) => {
    try {
        const params = exchange ? { exchange } : {};
        
        const response = await api.get('/ohlc/symbols/list', { params });

        if (!response.data?.success) {
            throw new Error('Failed to fetch available symbols');
        }

        return {
            count: response.data.count,
            exchange: response.data.exchange,
            symbols: response.data.symbols || [],
        };
    } catch (error) {
        console.error('Error fetching available OHLC symbols:', error);
        return {
            count: 0,
            exchange,
            symbols: [],
            error: error.message,
        };
    }
};

/**
 * Check if OHLC data is available for a symbol
 * @param {string} symbol - Stock symbol
 * @param {string} exchange - Exchange (NSE, BSE)
 * @returns {Promise<boolean>} True if data exists
 */
export const hasOHLCData = async (symbol, exchange = 'NSE') => {
    try {
        const result = await fetchAvailableOHLCSymbols(exchange);
        const cleanSymbol = symbol.replace(/\.(NS|BO)$/i, '');
        return result.symbols.includes(cleanSymbol);
    } catch (error) {
        console.error(`Error checking OHLC data for ${symbol}:`, error);
        return false;
    }
};

/**
 * Get OHLC data formatted for charting libraries (like Recharts)
 * @param {string} symbol - Stock symbol
 * @param {object} options - Query options
 * @returns {Promise} Array formatted for charts
 */
export const fetchOHLCForChart = async (symbol, options = {}) => {
    try {
        const result = await fetchOHLCData(symbol, options);

        if (!result.data || result.data.length === 0) {
            return [];
        }

        // Format for chart libraries
        return result.data.map(candle => ({
            date: new Date(candle.timestamp).toLocaleDateString(),
            timestamp: candle.timestamp,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume || 0,
            // Additional fields for technical analysis
            price: candle.close, // Alias for close
        }));
    } catch (error) {
        console.error(`Error fetching OHLC chart data for ${symbol}:`, error);
        return [];
    }
};

/**
 * Get price history (simplified - just close prices with timestamps)
 * Useful for simple line charts
 * @param {string} symbol - Stock symbol
 * @param {object} options - Query options
 * @returns {Promise} Array of {timestamp, price}
 */
export const fetchPriceHistory = async (symbol, options = {}) => {
    try {
        const result = await fetchOHLCData(symbol, options);

        if (!result.data || result.data.length === 0) {
            return [];
        }

        return result.data.map(candle => ({
            timestamp: candle.timestamp,
            price: candle.close,
            date: new Date(candle.timestamp).toLocaleDateString(),
        }));
    } catch (error) {
        console.error(`Error fetching price history for ${symbol}:`, error);
        return [];
    }
};

/**
 * Trigger backfill for a specific symbol (admin function)
 * @param {string} symbol - Stock symbol with suffix (e.g., 'TATAMOTORS.NS')
 * @param {object} options - Backfill options
 * @returns {Promise} Backfill result
 */
export const triggerBackfill = async (symbol, options = {}) => {
    try {
        const {
            exchange = 'NSE',
            timeframe = '1d',
            range = '1y',
        } = options;

        const response = await api.post('/admin/backfill/symbol', {
            symbol,
            exchange,
            timeframe,
            range,
        });

        return response.data;
    } catch (error) {
        console.error(`Error triggering backfill for ${symbol}:`, error);
        throw error;
    }
};

export default {
    fetchOHLCData,
    fetchLatestOHLC,
    fetchAvailableOHLCSymbols,
    hasOHLCData,
    fetchOHLCForChart,
    fetchPriceHistory,
    triggerBackfill,
};
