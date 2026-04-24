import api from './api';




export const fetchOHLCData = async (symbol, options = {}) => {
    try {
        const {
            exchange = 'NSE',
            timeframe = '1d',
            startDate,
            endDate,
            limit = 365,
        } = options;

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


export const fetchOHLCForChart = async (symbol, options = {}) => {
    try {
        const result = await fetchOHLCData(symbol, options);

        if (!result.data || result.data.length === 0) {
            return [];
        }

        return result.data.map(candle => ({
            date: new Date(candle.timestamp).toLocaleDateString(),
            timestamp: candle.timestamp,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume || 0,
            price: candle.close, // Alias for close
        }));
    } catch (error) {
        console.error(`Error fetching OHLC chart data for ${symbol}:`, error);
        return [];
    }
};


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
