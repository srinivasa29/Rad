import api from './api';

export const fetchNotifications = async () => {
    try {
        const response = await api.get('/notifications');
        return response.data;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

export const markNotificationsRead = async () => {
    try {
        const response = await api.post('/notifications/read');
        return response.data;
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        throw error;
    }
};