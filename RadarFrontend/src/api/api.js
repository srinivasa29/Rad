import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

export const hasAuthToken = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    return Boolean(localStorage.getItem('token'));
};

export const isUnauthorizedError = (error) => error?.response?.status === 401;

const api = axios.create({
    baseURL: apiBaseUrl,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (typeof window !== 'undefined' && error.response?.data?.error) {
            const event = new CustomEvent('api-error', { 
                detail: { message: error.response.data.error } 
            });
            window.dispatchEvent(event);
        }
        return Promise.reject(error);
    }
);

export default api;
