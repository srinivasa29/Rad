import { useMemo, useState, useEffect, useCallback } from 'react';
import {
    fetchMarketStatus,
    fetchUpdateStatus,
    fetchUpdateStats,
    fetchRefreshStatus,
    fetchRefreshStats,
    fetchCacheStats,
    fetchOfflineStatus,
} from '../api/adminApi';

/**
 * Custom hook for monitoring auto-update system (Sprint 1)
 * @param {number} refreshInterval - Auto-refresh interval (default: 10s)
 * @returns {object} { status, stats, marketStatus, loading, error, refetch }
 */
export const useAutoUpdateStatus = (refreshInterval = 10000) => {
    const [status, setStatus] = useState(null);
    const [stats, setStats] = useState(null);
    const [marketStatus, setMarketStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [statusData, statsData, marketData] = await Promise.all([
                fetchUpdateStatus(),
                fetchUpdateStats(),
                fetchMarketStatus(),
            ]);

            setStatus(statusData);
            setStats(statsData);
            setMarketStatus(marketData);
        } catch (err) {
            setError(err.message || 'Failed to fetch update status');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

        if (refreshInterval && refreshInterval > 0) {
            const intervalId = setInterval(fetchData, refreshInterval);
            return () => clearInterval(intervalId);
        }
    }, [refreshInterval, fetchData]);

    return {
        status,
        stats,
        marketStatus,
        loading,
        error,
        refetch: fetchData,
        // Convenience accessors
        isRunning: status?.cronRunning || false,
        isMarketOpen: marketStatus?.isOpen || false,
        lastUpdate: status?.lastUpdate || null,
    };
};

/**
 * Custom hook for monitoring smart refresh system (Sprint 3)
 * @param {number} refreshInterval - Auto-refresh interval (default: 15s)
 * @returns {object} { status, stats, loading, error, refetch }
 */
export const useSmartRefreshStatus = (refreshInterval = 15000) => {
    const [status, setStatus] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [statusData, statsData] = await Promise.all([
                fetchRefreshStatus(),
                fetchRefreshStats(),
            ]);

            setStatus(statusData);
            setStats(statsData);
        } catch (err) {
            setError(err.message || 'Failed to fetch refresh status');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

        if (refreshInterval && refreshInterval > 0) {
            const intervalId = setInterval(fetchData, refreshInterval);
            return () => clearInterval(intervalId);
        }
    }, [refreshInterval, fetchData]);

    return {
        status,
        stats,
        loading,
        error,
        refetch: fetchData,
        // Convenience accessors
        isRunning: status?.running || false,
        tiers: status?.tiers || {},
    };
};

/**
 * Custom hook for monitoring cache performance (Sprint 4)
 * @param {number} refreshInterval - Auto-refresh interval (default: 10s)
 * @returns {object} { stats, loading, error, refetch }
 */
export const useCacheStatus = (refreshInterval = 10000) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const statsData = await fetchCacheStats();
            setStats(statsData);
        } catch (err) {
            setError(err.message || 'Failed to fetch cache stats');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

        if (refreshInterval && refreshInterval > 0) {
            const intervalId = setInterval(fetchData, refreshInterval);
            return () => clearInterval(intervalId);
        }
    }, [refreshInterval, fetchData]);

    return {
        stats,
        loading,
        error,
        refetch: fetchData,
        // Convenience accessors
        hitRate: stats?.overall?.hitRate || 0,
        totalKeys: stats?.overall?.totalKeys || 0,
    };
};

/**
 * Custom hook for monitoring offline mode status (Sprint 4)
 * @param {number} refreshInterval - Auto-refresh interval (default: 5s)
 * @returns {object} { status, loading, error, refetch }
 */
export const useOfflineStatus = (refreshInterval = 5000) => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const statusData = await fetchOfflineStatus();
            setStatus(statusData);
        } catch (err) {
            setError(err.message || 'Failed to fetch offline status');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

        if (refreshInterval && refreshInterval > 0) {
            const intervalId = setInterval(fetchData, refreshInterval);
            return () => clearInterval(intervalId);
        }
    }, [refreshInterval, fetchData]);

    return {
        status,
        loading,
        error,
        refetch: fetchData,
        // Convenience accessors
        isOnline: status?.isOnline || false,
        failureCount: status?.consecutiveFailures || 0,
        lastFailure: status?.lastFailure || null,
    };
};

/**
 * Combined hook for complete system status
 * Monitors all Phase 2 systems in one hook
 * @param {number} refreshInterval - Auto-refresh interval (default: 15s)
 * @returns {object} Complete system status
 */
export const useSystemStatus = (refreshInterval = 15000) => {
    const autoUpdate = useAutoUpdateStatus(refreshInterval);
    const smartRefresh = useSmartRefreshStatus(refreshInterval);
    const cache = useCacheStatus(refreshInterval);
    const offline = useOfflineStatus(5000); // More frequent for offline checks

    const overallHealth = useMemo(() => {
        if (autoUpdate.loading || smartRefresh.loading || cache.loading || offline.loading) {
            return 'loading';
        }

        if (autoUpdate.error || smartRefresh.error || cache.error || offline.error) {
            return 'error';
        }

        // Check if critical systems are running
        const criticalSystemsUp = 
            offline.isOnline &&
            autoUpdate.isRunning &&
            smartRefresh.isRunning;

        if (criticalSystemsUp) {
            // Check cache performance
            const cacheHealthy = cache.hitRate >= 0.7; // 70% threshold
            return cacheHealthy ? 'healthy' : 'degraded';
        }

        return 'critical';
    }, [
        autoUpdate.loading, autoUpdate.error, autoUpdate.isRunning,
        smartRefresh.loading, smartRefresh.error, smartRefresh.isRunning,
        cache.loading, cache.error, cache.hitRate,
        offline.loading, offline.error, offline.isOnline,
    ]);

    return {
        autoUpdate,
        smartRefresh,
        cache,
        offline,
        overallHealth,
        // Convenience accessors
        allSystemsOperational: overallHealth === 'healthy',
        hasErrors: autoUpdate.error || smartRefresh.error || cache.error || offline.error,
    };
};

export default {
    useAutoUpdateStatus,
    useSmartRefreshStatus,
    useCacheStatus,
    useOfflineStatus,
    useSystemStatus,
};
