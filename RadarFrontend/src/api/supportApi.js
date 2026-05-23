import api from './api';

export const fetchSupportMeta = async () => {
    const response = await api.get('/support/meta');
    return response.data?.data ?? response.data;
};

export const submitSupportMessage = async (payload) => {
    const response = await api.post('/support/messages', payload);
    return response.data;
};
