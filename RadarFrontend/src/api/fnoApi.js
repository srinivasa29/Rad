import api, { hasAuthToken, isUnauthorizedError } from './api';

export const fetchFnoDashboard = async () => {
    if (!hasAuthToken()) {
        return null;
    }

    try {
        const response = await api.get('/fno/dashboard');
        return response.data;
    } catch (error) {
        if (isUnauthorizedError(error)) {
            return null;
        }

        console.error('Error fetching F&O dashboard:', error);
        throw error;
    }
};