import api from './api';

export const fetchEconomicCalendar = async () => {
    try {
        const response = await api.get('/calendar/economic');
        const payload = response.data?.data ?? response.data;
        return Array.isArray(payload) ? payload : [];
    } catch (error) {
        console.warn('Economic calendar unavailable, using UI fallback data:', error?.message || error);
        return [];
    }
};
