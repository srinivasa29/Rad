import api from './api';

const stripSuffix = (v) => String(v || '').replace(/\.(NS|BO)$/i, '');

export const fetchUserWatchlist = async (mode) => {
    try {
        const params = mode ? { mode } : {};
        const res = await api.get('/watchlist', { params });
        const lists = Array.isArray(res.data) ? res.data : [];
        // Return flat list of symbols from the first (default) watchlist
        // Items are stored as objects: {symbol: "RELIANCE.NS", addedAt: ...}
        if (lists.length === 0) return [];
        return (lists[0].items || []).map(i => {
            const sym = typeof i === 'string' ? i : (i?.symbol || i?.sym || '');
            return stripSuffix(sym);
        }).filter(Boolean);
    } catch (err) {
        console.warn('fetchUserWatchlist failed:', err.message);
        return [];
    }
};

export const fetchWatchlists = async (mode) => {
    try {
        const params = mode ? { mode } : {};
        const res = await api.get('/watchlist', { params });
        return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
        console.warn('fetchWatchlists failed:', err.message);
        return [];
    }
};

export const ensureWatchlist = async (mode = 'trader', name = 'Research Watchlist') => {
    const modeLists = await fetchWatchlists(mode);
    const named = modeLists.find((list) => String(list?.name || '').toLowerCase() === name.toLowerCase());
    if (named) return named;
    if (modeLists.length > 0) return modeLists[0];

    const created = await createWatchlist(name, mode);
    return created?.data ?? created;
};

export const addSymbolToWatchlist = async (watchlistId, symbol) => {
    try {
        const url = watchlistId ? `/watchlist/${watchlistId}/add` : '/watchlist/add';
        const res = await api.post(url, { symbol });
        return res.data;
    } catch (err) {
        console.error('addSymbolToWatchlist failed:', err.message);
        throw err;
    }
};

export const removeSymbolFromWatchlist = async (watchlistId, symbol) => {
    try {
        const url = watchlistId ? `/watchlist/${watchlistId}/remove/${encodeURIComponent(symbol)}` : `/watchlist/remove/${encodeURIComponent(symbol)}`;
        const res = await api.delete(url);
        return res.data;
    } catch (err) {
        console.error('removeSymbolFromWatchlist failed:', err.message);
        throw err;
    }
};


export const createWatchlist = async (name, mode) => {
    try {
        const body = { name };
        if (mode) body.mode = mode;
        const res = await api.post('/watchlist', body);
        return res.data;
    } catch (err) {
        console.error('createWatchlist failed:', err.message);
        throw err;
    }
};

// Fetch live price + technical data for a list of symbols in one call
export const fetchWatchlistLiveData = async (mode) => {
    try {
        const params = mode ? { mode } : {};
        const res = await api.get('/technical/watchlist', { params });
        const payload = res.data?.data ?? res.data;
        return Array.isArray(payload) ? payload : [];
    } catch (err) {
        console.warn('fetchWatchlistLiveData failed:', err.message);
        return [];
    }
};
