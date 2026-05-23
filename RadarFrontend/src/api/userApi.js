import api from './api';

export const fetchUserProfile = async () => {
    try {
        const response = await api.get('/user/profile');
        return response.data;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
};

export const updateUserProfile = async (payload) => {
    try {
        const response = await api.patch('/user/profile', payload);
        return response.data?.data ?? response.data;
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
};

export const fetchUserMode = async () => {
    try {
        const response = await api.get('/user/mode');
        return response.data;
    } catch (error) {
        console.error('Error fetching user mode:', error);
        throw error;
    }
};

export const updateUserMode = async (mode) => {
    try {
        const response = await api.patch('/user/mode', { mode });
        return response.data;
    } catch (error) {
        console.error('Error updating user mode:', error);
        throw error;
    }
};
