import api from './api';

export const runScreenerScan = async (filters) => {
    try {
        const response = await api.post('/screener/run', filters);
        return response.data;
    } catch (error) {
        console.error('Failed to run screener scan:', error);
        throw error;
    }
};
