import api, { hasAuthToken, isUnauthorizedError } from './api';

export const fetchPortfolio = async () => {
    if (!hasAuthToken()) {
        return { holdings: [], cashBalance: 0, totalTrades: 0 };
    }

    try {
        const response = await api.get('/portfolio');
        return response.data;
    } catch (error) {
        if (isUnauthorizedError(error)) {
            return { holdings: [], cashBalance: 0, totalTrades: 0 };
        }

        console.error("Error fetching portfolio:", error);
        throw error;
    }
};

export const executeTrade = async (tradeData) => {
    try {
        const response = await api.post('/portfolio/trade', tradeData);
        return response.data;
    } catch (error) {
        console.error("Error executing trade:", error);
        throw error;
    }
};
