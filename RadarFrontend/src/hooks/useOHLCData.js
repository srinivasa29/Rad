import { useState, useEffect, useCallback } from 'react';
import { fetchOHLCData, fetchLatestOHLC } from '../api/ohlcApi';
import { fetchEnhancedMarketHistory, hasCachedData } from '../api/enhancedMarketApi';

/**
 * Custom hook for fetching and managing OHLC historical data
 * Provides automatic loading states, error handling, and caching
 * 
 * @param {string} symbol - Stock symbol
 * @param {object} options - Configuration options
 * @returns {object} { data, loading, error, refetch, hasCached }
 */
export const useOHLCData = (symbol, options = {}) => {
    const {
        exchange = 'NSE',
        timeframe = '1d',
        limit = 365,
        autoFetch = true,
    } = options;

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasCached, setHasCached] = useState(false);

    const fetchData = useCallback(async () => {
        if (!symbol) return;

        setLoading(true);
        setError(null);

        try {
            const result = await fetchOHLCData(symbol, {
                exchange,
                timeframe,
                limit,
            });

            if (result.error) {
                setError(result.error);
                setData([]);
            } else {
                setData(result.data || []);
                setHasCached(result.data && result.data.length > 0);
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch OHLC data');
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [symbol, exchange, timeframe, limit]);

    useEffect(() => {
        if (autoFetch) {
            Promise.resolve().then(fetchData);
        }
    }, [autoFetch, fetchData]);

    return {
        data,
        loading,
        error,
        refetch: fetchData,
        hasCached,
        count: data.length,
    };
};

/**
 * Hook for fetching latest OHLC candle
 * @param {string} symbol - Stock symbol
 * @param {object} options - Configuration options
 * @returns {object} { data, loading, error, refetch }
 */
export const useLatestOHLC = (symbol, options = {}) => {
    const {
        exchange = 'NSE',
        timeframe = '1d',
        autoFetch = true,
        refreshInterval = null, // Auto-refresh interval in ms (null = no auto-refresh)
    } = options;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!symbol) return;

        setLoading(true);
        setError(null);

        try {
            const result = await fetchLatestOHLC(symbol, {
                exchange,
                timeframe,
            });

            if (result.error) {
                setError(result.error);
                setData(null);
            } else {
                setData(result.data);
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch latest OHLC');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [symbol, exchange, timeframe]);

    useEffect(() => {
        if (autoFetch) {
            fetchData();
        }

        // Set up auto-refresh if specified
        if (refreshInterval && refreshInterval > 0) {
            const intervalId = setInterval(fetchData, refreshInterval);
            return () => clearInterval(intervalId);
        }
    }, [autoFetch, refreshInterval, fetchData]);

    return {
        data,
        loading,
        error,
        refetch: fetchData,
    };
};

/**
 * Hook for fetching chart-ready data with automatic source selection
 * Uses OHLC storage when available, falls back to external API
 * @param {string} symbol - Stock symbol
 * @param {object} options - Configuration options
 * @returns {object} { data, loading, error, refetch, isCached }
 */
export const useChartData = (symbol, options = {}) => {
    const {
        type = 'STOCK',
        interval = '1D',
        limit = 90,
        autoFetch = true,
    } = options;

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isCached, setIsCached] = useState(false);

    const fetchData = useCallback(async () => {
        if (!symbol) return;

        setLoading(true);
        setError(null);

        try {
            // Use enhanced API that tries OHLC first
            const result = await fetchEnhancedMarketHistory(symbol, type, interval, { limit });

            setData(result.data || []);
            setIsCached(result.source === 'ohlc-storage');
        } catch (err) {
            setError(err.message || 'Failed to fetch chart data');
            setData([]);
            setIsCached(false);
        } finally {
            setLoading(false);
        }
    }, [symbol, type, interval, limit]);

    useEffect(() => {
        if (autoFetch) {
            fetchData();
        }
    }, [autoFetch, fetchData]);

    return {
        data,
        loading,
        error,
        refetch: fetchData,
        isCached,
        count: data.length,
    };
};

/**
 * Hook to check if symbol has cached OHLC data
 * @param {string} symbol - Stock symbol
 * @returns {object} { hasCached, loading }
 */
export const useHasCachedData = (symbol) => {
    const [hasCached, setHasCached] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkCache = async () => {
            if (!symbol) {
                setHasCached(false);
                setLoading(false);
                return;
            }

            try {
                const cached = await hasCachedData(symbol);
                setHasCached(cached);
            } catch (error) {
                setHasCached(false);
            } finally {
                setLoading(false);
            }
        };

        checkCache();
    }, [symbol]);

    return { hasCached, loading };
};

/**
 * Hook for multiple symbols (batch fetching)
 * @param {Array<string>} symbols - Array of stock symbols
 * @param {object} options - Configuration options
 * @returns {object} { dataMap, loading, errors }
 */
export const useMultipleOHLC = (symbols = [], options = {}) => {
    const {
        exchange = 'NSE',
        timeframe = '1d',
        limit = 30,
        autoFetch = true,
    } = options;

    const [dataMap, setDataMap] = useState({});
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const fetchData = useCallback(async () => {
        if (!symbols || symbols.length === 0) return;

        setLoading(true);

        const newDataMap = {};
        const newErrors = {};

        // Fetch data for all symbols
        await Promise.all(
            symbols.map(async (symbol) => {
                try {
                    const result = await fetchLatestOHLC(symbol, {
                        exchange,
                        timeframe,
                    });

                    if (result.error) {
                        newErrors[symbol] = result.error;
                    } else {
                        newDataMap[symbol] = result.data;
                    }
                } catch (err) {
                    newErrors[symbol] = err.message;
                }
            })
        );

        setDataMap(newDataMap);
        setErrors(newErrors);
        setLoading(false);
    }, [symbols, exchange, timeframe]);

    useEffect(() => {
        if (autoFetch) {
            fetchData();
        }
    }, [autoFetch, fetchData]);

    return {
        dataMap,
        loading,
        errors,
        refetch: fetchData,
    };
};

export default {
    useOHLCData,
    useLatestOHLC,
    useChartData,
    useHasCachedData,
    useMultipleOHLC,
};
