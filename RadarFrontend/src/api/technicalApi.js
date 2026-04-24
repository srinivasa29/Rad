import api, { hasAuthToken, isUnauthorizedError } from './api';

export const fetchTechnicalSummary = async (assetType, symbol, options = {}) => {
    try {
        const params = {};
        if (options.strictLive) {
            params.strictLive = true;
        }

        const response = await api.get(`/technical/summary/${assetType}/${symbol}`, { params });
        return response.data?.data ?? response.data;
    } catch (error) {
        const status = error?.response?.status;
        if (isUnauthorizedError(error) || (status && Number(status) >= 500)) {
            return null;
        }

        console.error("Error fetching technical summary:", error);
        throw error;
    }
};

export const fetchWatchlistTechnicals = async () => {
    try {
        const response = await api.get('/watchlist');
        const payload = response.data?.data ?? response.data;
        return Array.isArray(payload) ? payload : [];
    } catch (error) {
        if (isUnauthorizedError(error)) {
            return [];
        }

        console.error("Error fetching watchlist technicals:", error);
        throw error;
    }
};

export const fetchBreakoutAlerts = async () => {
    if (!hasAuthToken()) {
        return [];
    }

    try {
        const response = await api.get('/alerts');
        return response.data;
    } catch (error) {
        if (isUnauthorizedError(error)) {
            return [];
        }

        console.error("Error fetching breakout alerts:", error);
        throw error;
    }
};

export const fetchIndicatorSignals = async () => {
    if (!hasAuthToken()) {
        return [];
    }

    try {
        const response = await api.get('/signals');
        return response.data;
    } catch (error) {
        if (isUnauthorizedError(error)) {
            return [];
        }

        console.error("Error fetching indicator signals:", error);
        throw error;
    }
};

export const fetchQuickOrderData = async (symbol) => {
    if (!hasAuthToken()) {
        return { bids: [], asks: [] };
    }

    try {
        const response = await api.get(`/technical/depth/${encodeURIComponent(symbol)}`);
        return response.data;
    } catch (error) {
        if (isUnauthorizedError(error)) {
            return { bids: [], asks: [] };
        }

        console.error("Error fetching market depth:", error);
        throw error;
    }
};
