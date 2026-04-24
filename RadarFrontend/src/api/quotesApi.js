import api from './api';




export const fetchRealtimeQuote = async (symbol, options = {}) => {
    try {
        const { maxAge = 60000 } = options;
        
        const params = {};
        if (maxAge) params.maxAge = maxAge;

        const response = await api.get(`/quotes/${symbol}`, { params });
        const payload = response.data || {};
        const quote = payload?.data;

        if (!payload?.success || !quote) {
            throw new Error(payload?.message || 'Failed to fetch quote');
        }

        const price = Number(quote.current ?? quote.price);
        const change = Number(quote.change);
        const changePercent = Number(quote.changePercent);
        const high = Number(quote.high);
        const low = Number(quote.low);
        const open = Number(quote.open);
        const previousClose = Number(quote.previousClose);
        const volume = Number(quote.volume);

        return {
            symbol: String(quote.symbol || symbol || '').toUpperCase(),
            price: Number.isFinite(price) ? price : null,
            change: Number.isFinite(change) ? change : null,
            changePercent: Number.isFinite(changePercent) ? changePercent : null,
            high: Number.isFinite(high) ? high : null,
            low: Number.isFinite(low) ? low : null,
            open: Number.isFinite(open) ? open : null,
            previousClose: Number.isFinite(previousClose) ? previousClose : null,
            volume: Number.isFinite(volume) ? volume : null,
            timestamp: quote.timestamp || payload.timestamp || null,
            source: payload.source || quote.source || 'unknown',
            cached: Boolean(payload.cached),
            age: payload.age ?? null,
            stale: Boolean(payload.stale),
            warning: payload.warning || null,
        };
    } catch (error) {
        console.error(`Error fetching real-time quote for ${symbol}:`, error);
        return {
            symbol,
            error: error.message,
            price: null,
            change: null,
            changePercent: null,
        };
    }
};


export const fetchBatchQuotes = async (symbols, options = {}) => {
    try {
        const { maxAge = 60000 } = options;

        const response = await api.post('/quotes/batch', {
            symbols,
            maxAge,
        });
        const payload = response.data || {};

        if (!payload?.success || !Array.isArray(payload?.data)) {
            throw new Error('Failed to fetch batch quotes');
        }

        const quotes = {};
        const errors = {};

        payload.data.forEach((item, index) => {
            const raw = item?.data || {};
            const requestedSymbol = String(symbols[index] || item?.symbol || raw?.symbol || '').toUpperCase();
            const responseSymbol = String(item?.symbol || raw?.symbol || requestedSymbol).toUpperCase();

            if (!item?.success) {
                if (requestedSymbol) {
                    errors[requestedSymbol] = item?.message || 'Quote unavailable';
                }
                return;
            }

            const price = Number(raw.current ?? raw.price);
            const change = Number(raw.change);
            const changePercent = Number(raw.changePercent);
            const high = Number(raw.high);
            const low = Number(raw.low);
            const open = Number(raw.open);
            const previousClose = Number(raw.previousClose);
            const volume = Number(raw.volume);

            const normalized = {
                symbol: responseSymbol,
                price: Number.isFinite(price) ? price : null,
                change: Number.isFinite(change) ? change : null,
                changePercent: Number.isFinite(changePercent) ? changePercent : null,
                high: Number.isFinite(high) ? high : null,
                low: Number.isFinite(low) ? low : null,
                open: Number.isFinite(open) ? open : null,
                previousClose: Number.isFinite(previousClose) ? previousClose : null,
                volume: Number.isFinite(volume) ? volume : null,
                timestamp: raw.timestamp || payload.timestamp || null,
                source: item?.source || payload.source || 'unknown',
                cached: Boolean(item?.cached),
                age: item?.age ?? null,
                stale: Boolean(item?.stale),
                warning: item?.warning || null,
            };

            if (requestedSymbol) {
                quotes[requestedSymbol] = normalized;
            }
            if (responseSymbol && responseSymbol !== requestedSymbol) {
                quotes[responseSymbol] = normalized;
            }
        });

        return {
            count: payload.total ?? symbols.length,
            successful: payload.successful ?? Object.keys(quotes).length,
            failed: payload.failed ?? Math.max(0, symbols.length - Object.keys(quotes).length),
            quotes,
            errors,
        };
    } catch (error) {
        console.error('Error fetching batch quotes:', error);
        return {
            count: 0,
            successful: 0,
            failed: symbols.length,
            quotes: {},
            errors: {},
            error: error.message,
        };
    }
};


export const fetchQuoteStats = async () => {
    try {
        const response = await api.get('/quotes/stats/all');
        const payload = response.data || {};

        if (!payload?.success) {
            throw new Error('Failed to fetch quote stats');
        }

        return payload.data || null;
    } catch (error) {
        console.error('Error fetching quote stats:', error);
        return null;
    }
};


export const fetchRateLimits = async () => {
    try {
        const response = await api.get('/quotes/ratelimits');
        const payload = response.data || {};

        if (!payload?.success) {
            throw new Error('Failed to fetch rate limits');
        }

        return payload.data || null;
    } catch (error) {
        console.error('Error fetching rate limits:', error);
        return null;
    }
};


export const testQuoteConnections = async () => {
    try {
        const response = await api.get('/quotes/test/connections');
        const payload = response.data || {};

        if (!payload?.success) {
            throw new Error('Failed to test connections');
        }

        return payload.details || null;
    } catch (error) {
        console.error('Error testing connections:', error);
        return null;
    }
};


export const resetQuoteStats = async () => {
    try {
        const response = await api.post('/quotes/stats/reset');
        return response.data;
    } catch (error) {
        console.error('Error resetting quote stats:', error);
        throw error;
    }
};


export const fetchWatchlistQuotes = async (symbols) => {
    return fetchBatchQuotes(symbols, { maxAge: 300000 });
};


export const fetchNifty50Quotes = async (symbols) => {
    return fetchBatchQuotes(symbols, { maxAge: 60000 });
};

export default {
    fetchRealtimeQuote,
    fetchBatchQuotes,
    fetchQuoteStats,
    fetchRateLimits,
    testQuoteConnections,
    resetQuoteStats,
    fetchWatchlistQuotes,
    fetchNifty50Quotes,
};
