import api from './api';

export const fetchEconomicCalendar = async () => {
    try {
        const response = await api.get('/calendar/economic');
        const payload = response.data?.data ?? response.data;
        return Array.isArray(payload) ? payload : [];
    } catch (error) {
        console.error("Error fetching economic calendar:", error);
        throw error;
    }
};
