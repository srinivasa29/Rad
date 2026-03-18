import api, { isUnauthorizedError } from './api';

export const fetchPulse = async () => {
    try {
        const response = await api.get('/analytics/pulse');
        return response.data;
    } catch (error) {
        if (isUnauthorizedError(error)) {
            return { gapUp: [], gapDown: [], volumeShockers: [] };
        }

        console.error("Error fetching pulse data:", error);
        throw error;
    }
};

export const fetchHeatmap = async () => {
    try {
        const response = await api.get('/analytics/heatmap');
        return response.data;
    } catch (error) {
        if (isUnauthorizedError(error)) {
            return [];
        }

        console.error("Error fetching heatmap data:", error);
        throw error;
    }
};
