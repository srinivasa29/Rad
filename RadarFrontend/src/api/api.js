import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
const STOCK_SUFFIX_REGEX = /\b([A-Z0-9^_-]+)\.(NS|BO)\b/g;

const stripStockSuffixInString = (value) => String(value || '').replace(STOCK_SUFFIX_REGEX, '$1');

const sanitizeStockSuffixes = (value) => {
    if (Array.isArray(value)) {
        return value.map((item) => sanitizeStockSuffixes(item));
    }

    if (value && typeof value === 'object') {
        return Object.entries(value).reduce((acc, [key, item]) => {
            acc[key] = sanitizeStockSuffixes(item);
            return acc;
        }, {});
    }

    if (typeof value === 'string') {
        return stripStockSuffixInString(value);
    }

    return value;
};

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
    (response) => {
        if (response && typeof response === 'object' && response.data !== undefined) {
            response.data = sanitizeStockSuffixes(response.data);
        }
        return response;
    },
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
