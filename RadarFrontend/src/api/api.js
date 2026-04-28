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

const AUTH_KEYS = ['token', 'user', 'mode', 'userId', 'userEmail'];

const clearAuthAndRedirect = () => {
    AUTH_KEYS.forEach(k => localStorage.removeItem(k));
    // Only redirect if not already on an auth page
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
    }
};

api.interceptors.response.use(
    (response) => {
        if (response && typeof response === 'object' && response.data !== undefined) {
            response.data = sanitizeStockSuffixes(response.data);
        }
        return response;
    },
    (error) => {
        const status = error.response?.status;
        const msg = error.response?.data?.error || '';

        // Stale / invalid token — wipe it and force re-login
        if (status === 401 && (msg.includes('token failed') || msg.includes('invalid signature') || msg.includes('Not authorized'))) {
            clearAuthAndRedirect();
            return Promise.reject(error);
        }

        if (typeof window !== 'undefined' && msg) {
            const event = new CustomEvent('api-error', { detail: { message: msg } });
            window.dispatchEvent(event);
        }
        return Promise.reject(error);
    }
);

export const saveToDefaultWatchlist = async (symbol) => {
    try {
        const watchlistsRes = await api.get('/watchlist');
        let defaultId = null;
        
        if (watchlistsRes.data?.length > 0) {
            defaultId = watchlistsRes.data[0]._id;
        } else {
            const createRes = await api.post('/watchlist', { name: 'My Watchlist' });
            defaultId = createRes.data._id;
        }
        
        if (defaultId) {
            const addRes = await api.post(`/watchlist/${defaultId}/add`, { symbol });
            return { success: true, data: addRes.data };
        }
        throw new Error("Could not find or create a watchlist");
    } catch (error) {
        console.error("Failed to save to watchlist:", error);
        throw error;
    }
};

export default api;
