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

export const createCustomFilter = async ({ name, options, logicQuery }) => {
    const response = await api.post('/screener/filters', { name, options, logicQuery });
    return response.data;
};

export const getCustomFilters = async () => {
    const response = await api.get('/screener/filters');
    return response.data;
};

export const deleteCustomFilter = async (id) => {
    const response = await api.delete(`/screener/filters/${id}`);
    return response.data;
};

