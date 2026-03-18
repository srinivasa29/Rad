import api from './api';

export const fetchSectorPerformance = async (period = '1y') => {
    try {
        const response = await api.get(`/sectors/performance?period=${period}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching sector performance:", error);
        throw error;
    }
};

export const fetchMarketData = async (params = {}) => {
    try {
        const response = await api.get('/market', { params });
        const payload = response.data?.data ?? response.data;
        return Array.isArray(payload) ? payload : [];
    } catch (error) {
        console.error("Error fetching market data:", error);
        throw error;
    }
};

export const fetchMarketHistory = async (symbol, type = 'STOCK', interval = '1D') => {
    try {
        const response = await api.get('/market/history', {
            params: { symbol, type, interval }
        });

        const payload = response.data?.data ?? response.data;
        const prices = Array.isArray(payload?.prices)
            ? payload.prices
            : Array.isArray(payload)
                ? payload
                : [];

        const normalized = prices
            .map((point, index, array) => {
                const close = Number(point?.close ?? point?.price ?? point?.value ?? 0);
                if (!Number.isFinite(close) || close <= 0) {
                    return null;
                }

                const prevPoint = array[Math.max(0, index - 1)] || point;
                const prevClose = Number(prevPoint?.close ?? prevPoint?.price ?? close);
                const open = Number(point?.open ?? prevClose ?? close);
                const high = Number(point?.high ?? Math.max(open, close));
                const low = Number(point?.low ?? Math.min(open, close));
                const timestamp = point?.timestamp ?? point?.time ?? point?.date ?? new Date().toISOString();

                return {
                    timestamp,
                    open: Number.isFinite(open) ? open : close,
                    high: Number.isFinite(high) ? high : close,
                    low: Number.isFinite(low) ? low : close,
                    close,
                };
            })
            .filter(Boolean);

        return {
            data: normalized,
            indicators: payload?.indicators ?? null,
        };
    } catch (error) {
        console.error("Error fetching market history:", error);
        throw error;
    }
};

export const fetchMarketNews = async () => {
    try {
        const response = await api.get('/market/news');
        return response.data;
    } catch (error) {
        console.error("Error fetching market news:", error);
        throw error;
    }
};

export const fetchTrendingSearches = async () => {
    try {
        const response = await api.get('/market/search/trending');
        const payload = response.data?.trending ?? response.data?.data ?? [];
        return Array.isArray(payload) ? payload : [];
    } catch (error) {
        console.error('Error fetching trending searches:', error);
        return [];
    }
};

export const logSearchQuery = async (query) => {
    try {
        await api.post('/market/search/log', { query });
    } catch (error) {
        console.error('Error logging search query:', error);
    }
};
