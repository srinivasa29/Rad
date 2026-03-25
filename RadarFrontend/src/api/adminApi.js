import api from './api';

/**
 * Admin API - Phase 2 Integration
 * 
 * This service provides admin controls for:
 * - Auto-update system (Sprint 1)
 * - Smart refresh management (Sprint 3)
 * - Cache & offline mode (Sprint 4)
 * 
 * Use these endpoints for monitoring and control dashboards
 */

// ==================== AUTO-UPDATE ADMIN (Sprint 1) ====================

/**
 * Get market status (NSE hours, holidays)
 * @returns {Promise} Market status information
 */
export const fetchMarketStatus = async () => {
    try {
        const response = await api.get('/admin/updates/market-status');
        return response.data;
    } catch (error) {
        console.error('Error fetching market status:', error);
        return null;
    }
};

/**
 * Get auto-update system status
 * @returns {Promise} Update system status
 */
export const fetchUpdateStatus = async () => {
    try {
        const response = await api.get('/admin/updates/update-status');
        return response.data;
    } catch (error) {
        console.error('Error fetching update status:', error);
        return null;
    }
};

/**
 * Get update statistics (success/failure rates)
 * @returns {Promise} Update statistics
 */
export const fetchUpdateStats = async () => {
    try {
        const response = await api.get('/admin/updates/update-stats');
        return response.data;
    } catch (error) {
        console.error('Error fetching update stats:', error);
        return null;
    }
};

/**
 * Trigger manual update for all symbols
 * @returns {Promise} Update result
 */
export const triggerManualUpdate = async () => {
    try {
        const response = await api.post('/admin/updates/trigger-update');
        return response.data;
    } catch (error) {
        console.error('Error triggering update:', error);
        throw error;
    }
};

/**
 * Update specific symbol
 * @param {string} symbol - Stock symbol (e.g., 'RELIANCE')
 * @returns {Promise} Update result
 */
export const updateSymbol = async (symbol) => {
    try {
        const response = await api.post('/admin/updates/update-symbol', { symbol });
        return response.data;
    } catch (error) {
        console.error(`Error updating symbol ${symbol}:`, error);
        throw error;
    }
};

/**
 * Start auto-update cron job
 * @returns {Promise} Start result
 */
export const startUpdateCron = async () => {
    try {
        const response = await api.post('/admin/updates/start-cron');
        return response.data;
    } catch (error) {
        console.error('Error starting cron:', error);
        throw error;
    }
};

/**
 * Stop auto-update cron job
 * @returns {Promise} Stop result
 */
export const stopUpdateCron = async () => {
    try {
        const response = await api.post('/admin/updates/stop-cron');
        return response.data;
    } catch (error) {
        console.error('Error stopping cron:', error);
        throw error;
    }
};

/**
 * Reset update statistics
 * @returns {Promise} Reset result
 */
export const resetUpdateStats = async () => {
    try {
        const response = await api.post('/admin/updates/reset-stats');
        return response.data;
    } catch (error) {
        console.error('Error resetting stats:', error);
        throw error;
    }
};

// ==================== SMART REFRESH ADMIN (Sprint 3) ====================

/**
 * Get smart refresh system status
 * @returns {Promise} Refresh status
 */
export const fetchRefreshStatus = async () => {
    try {
        const response = await api.get('/admin/refresh/status');
        return response.data;
    } catch (error) {
        console.error('Error fetching refresh status:', error);
        return null;
    }
};

/**
 * Get refresh statistics
 * @returns {Promise} Refresh statistics
 */
export const fetchRefreshStats = async () => {
    try {
        const response = await api.get('/admin/refresh/stats');
        return response.data;
    } catch (error) {
        console.error('Error fetching refresh stats:', error);
        return null;
    }
};

/**
 * Start smart refresh service
 * @returns {Promise} Start result
 */
export const startSmartRefresh = async () => {
    try {
        const response = await api.post('/admin/refresh/start');
        return response.data;
    } catch (error) {
        console.error('Error starting refresh:', error);
        throw error;
    }
};

/**
 * Stop smart refresh service
 * @returns {Promise} Stop result
 */
export const stopSmartRefresh = async () => {
    try {
        const response = await api.post('/admin/refresh/stop');
        return response.data;
    } catch (error) {
        console.error('Error stopping refresh:', error);
        throw error;
    }
};

/**
 * Add symbol to refresh tier
 * @param {string} symbol - Stock symbol
 * @param {number} tier - Tier number (1, 2, or 3)
 * @returns {Promise} Add result
 */
export const addSymbolToTier = async (symbol, tier) => {
    try {
        const response = await api.post('/admin/refresh/add-symbol', { symbol, tier });
        return response.data;
    } catch (error) {
        console.error(`Error adding ${symbol} to tier ${tier}:`, error);
        throw error;
    }
};

/**
 * Add multiple symbols to tier (batch)
 * @param {Array<string>} symbols - Array of stock symbols
 * @param {number} tier - Tier number (1, 2, or 3)
 * @returns {Promise} Batch add result
 */
export const addSymbolsToTier = async (symbols, tier) => {
    try {
        const response = await api.post('/admin/refresh/add-symbols', { symbols, tier });
        return response.data;
    } catch (error) {
        console.error(`Error adding symbols to tier ${tier}:`, error);
        throw error;
    }
};

/**
 * Remove symbol from its tier
 * @param {string} symbol - Stock symbol
 * @returns {Promise} Remove result
 */
export const removeSymbolFromTier = async (symbol) => {
    try {
        const response = await api.post('/admin/refresh/remove-symbol', { symbol });
        return response.data;
    } catch (error) {
        console.error(`Error removing ${symbol}:`, error);
        throw error;
    }
};

/**
 * Check which tier a symbol belongs to
 * @param {string} symbol - Stock symbol
 * @returns {Promise} Symbol tier information
 */
export const getSymbolTier = async (symbol) => {
    try {
        const response = await api.get(`/admin/refresh/symbol/${symbol}`);
        return response.data;
    } catch (error) {
        console.error(`Error checking tier for ${symbol}:`, error);
        return null;
    }
};

// ==================== CACHE & OFFLINE ADMIN (Sprint 4) ====================

/**
 * Get cache statistics
 * @returns {Promise} Cache statistics
 */
export const fetchCacheStats = async () => {
    try {
        const response = await api.get('/admin/cache/stats');
        return response.data;
    } catch (error) {
        console.error('Error fetching cache stats:', error);
        return null;
    }
};

/**
 * Get cache keys by type
 * @param {string} type - Cache type (quotes, ohlc, company, symbols)
 * @returns {Promise} Cache keys
 */
export const fetchCacheKeys = async (type) => {
    try {
        const response = await api.get(`/admin/cache/keys/${type}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching ${type} cache keys:`, error);
        return null;
    }
};

/**
 * Clear entire cache
 * @returns {Promise} Clear result
 */
export const clearCache = async () => {
    try {
        const response = await api.post('/admin/cache/clear');
        return response.data;
    } catch (error) {
        console.error('Error clearing cache:', error);
        throw error;
    }
};

/**
 * Warm cache with popular symbols
 * @param {Array<string>} symbols - Optional custom symbols (default: Nifty 50 top 20)
 * @returns {Promise} Warm result
 */
export const warmCache = async (symbols = null) => {
    try {
        const body = symbols ? { symbols } : {};
        const response = await api.post('/admin/cache/warm', body);
        return response.data;
    } catch (error) {
        console.error('Error warming cache:', error);
        throw error;
    }
};

/**
 * Reset cache statistics
 * @returns {Promise} Reset result
 */
export const resetCacheStats = async () => {
    try {
        const response = await api.post('/admin/cache/reset-stats');
        return response.data;
    } catch (error) {
        console.error('Error resetting cache stats:', error);
        throw error;
    }
};

/**
 * Get offline mode status
 * @returns {Promise} Offline status
 */
export const fetchOfflineStatus = async () => {
    try {
        const response = await api.get('/admin/offline/status');
        return response.data;
    } catch (error) {
        console.error('Error fetching offline status:', error);
        return null;
    }
};

/**
 * Force system online
 * @returns {Promise} Force online result
 */
export const forceOnline = async () => {
    try {
        const response = await api.post('/admin/offline/force-online');
        return response.data;
    } catch (error) {
        console.error('Error forcing online:', error);
        throw error;
    }
};

/**
 * Force system offline (testing)
 * @returns {Promise} Force offline result
 */
export const forceOffline = async () => {
    try {
        const response = await api.post('/admin/offline/force-offline');
        return response.data;
    } catch (error) {
        console.error('Error forcing offline:', error);
        throw error;
    }
};

export default {
    // Auto-update
    fetchMarketStatus,
    fetchUpdateStatus,
    fetchUpdateStats,
    triggerManualUpdate,
    updateSymbol,
    startUpdateCron,
    stopUpdateCron,
    resetUpdateStats,
    
    // Smart refresh
    fetchRefreshStatus,
    fetchRefreshStats,
    startSmartRefresh,
    stopSmartRefresh,
    addSymbolToTier,
    addSymbolsToTier,
    removeSymbolFromTier,
    getSymbolTier,
    
    // Cache & offline
    fetchCacheStats,
    fetchCacheKeys,
    clearCache,
    warmCache,
    resetCacheStats,
    fetchOfflineStatus,
    forceOnline,
    forceOffline,
};
