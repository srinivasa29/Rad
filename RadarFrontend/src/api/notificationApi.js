import api from './api';

export const fetchNotifications = async () => {
    try {
        const response = await api.get('/notifications/user');
        return response.data.data; // data.data is our array from controller
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
};

export const markNotificationsRead = async () => {
    try {
        const response = await api.patch('/notifications/read-all');
        return response.data;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};

export const markSingleNotificationRead = async (id) => {
    try {
        const response = await api.patch(`/notifications/read/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error marking single notification as read:', error);
        throw error;
    }
};