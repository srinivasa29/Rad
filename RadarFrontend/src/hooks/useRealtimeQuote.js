import { useState, useEffect, useCallback } from 'react';
import {
    fetchRealtimeQuote,
    fetchBatchQuotes,
    fetchQuoteStats,
    fetchRateLimits,
} from '../api/quotesApi';


export const useRealtimeQuote = (symbol, options = {}) => {
    const {
        autoFetch = true,
        refreshInterval = 60000, // 1 minute default
        maxAge = 60000,
    } = options;

    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isStale, setIsStale] = useState(false);

    const fetchQuote = useCallback(async () => {
        if (!symbol) return;

        setLoading(true);
        setError(null);

        try {
            const result = await fetchRealtimeQuote(symbol, { maxAge });

            if (result.error) {
                setError(result.error);
                setQuote(null);
                setIsStale(false);
            } else {
                setQuote(result);
                setIsStale(result.stale || false);
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch real-time quote');
            setQuote(null);
            setIsStale(false);
        } finally {
            setLoading(false);
        }
    }, [symbol, maxAge]);

    useEffect(() => {
        if (autoFetch) {
            fetchQuote();
        }

        if (refreshInterval && refreshInterval > 0) {
            const intervalId = setInterval(fetchQuote, refreshInterval);
            return () => clearInterval(intervalId);
        }
    }, [autoFetch, refreshInterval, fetchQuote]);

    return {
        quote,
        loading,
        error,
        refetch: fetchQuote,
        isStale,
        price: quote?.price,
        change: quote?.change,
        changePercent: quote?.changePercent,
        volume: quote?.volume,
        source: quote?.source,
    };
};


export const useBatchQuotes = (symbols = [], options = {}) => {
    const {
        autoFetch = true,
        refreshInterval = 300000, // 5 minutes default for batch
        maxAge = 300000,
    } = options;

    const [quotes, setQuotes] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ successful: 0, failed: 0 });

    const fetchQuotes = useCallback(async () => {
        if (!symbols || symbols.length === 0) return;

        setLoading(true);
        setError(null);

        try {
            const result = await fetchBatchQuotes(symbols, { maxAge });

            if (result.error) {
                setError(result.error);
                setQuotes({});
                setStats({ successful: 0, failed: symbols.length });
            } else {
                setQuotes(result.quotes || {});
                setStats({
                    successful: result.successful || 0,
                    failed: result.failed || 0,
                });
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch batch quotes');
            setQuotes({});
            setStats({ successful: 0, failed: symbols.length });
        } finally {
            setLoading(false);
        }
    }, [symbols, maxAge]);

    useEffect(() => {
        if (autoFetch) {
            fetchQuotes();
        }

        if (refreshInterval && refreshInterval > 0) {
            const intervalId = setInterval(fetchQuotes, refreshInterval);
            return () => clearInterval(intervalId);
        }
    }, [autoFetch, refreshInterval, fetchQuotes]);

    return {
        quotes,
        loading,
        error,
        refetch: fetchQuotes,
        stats,
        count: Object.keys(quotes).length,
    };
};


export const useWatchlistQuotes = (watchlistSymbols) => {
    return useBatchQuotes(watchlistSymbols, {
        autoFetch: true,
        refreshInterval: 300000, // 5 minutes
        maxAge: 300000,
    });
};


export const usePortfolioQuotes = (portfolioSymbols) => {
    const batchResult = useBatchQuotes(portfolioSymbols, {
        autoFetch: true,
        refreshInterval: 300000, // 5 minutes
        maxAge: 300000,
    });

    const totalValue = Object.values(batchResult.quotes).reduce(
        (sum, quote) => sum + (quote?.price || 0),
        0
    );

    return {
        ...batchResult,
        totalValue,
    };
};


export const useQuoteStats = (refreshInterval = 30000) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await fetchQuoteStats();
            setStats(result);
        } catch (err) {
            setError(err.message || 'Failed to fetch stats');
            setStats(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();

        if (refreshInterval && refreshInterval > 0) {
            const intervalId = setInterval(fetchStats, refreshInterval);
            return () => clearInterval(intervalId);
        }
    }, [refreshInterval, fetchStats]);

    return {
        stats,
        loading,
        error,
        refetch: fetchStats,
    };
};


export const useRateLimits = (refreshInterval = 60000) => {
    const [limits, setLimits] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchLimits = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await fetchRateLimits();
            setLimits(result);
        } catch (err) {
            setError(err.message || 'Failed to fetch rate limits');
            setLimits(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLimits();

        if (refreshInterval && refreshInterval > 0) {
            const intervalId = setInterval(fetchLimits, refreshInterval);
            return () => clearInterval(intervalId);
        }
    }, [refreshInterval, fetchLimits]);

    return {
        limits,
        loading,
        error,
        refetch: fetchLimits,
    };
};


export const usePriceComparison = (symbol) => {
    const { quote, loading: quoteLoading } = useRealtimeQuote(symbol);

    return {
        current: quote?.price || null,
        previous: quote?.previousClose || null,
        change: quote?.change || null,
        changePercent: quote?.changePercent || null,
        loading: quoteLoading,
        high: quote?.high || null,
        low: quote?.low || null,
        open: quote?.open || null,
    };
};

export default {
    useRealtimeQuote,
    useBatchQuotes,
    useWatchlistQuotes,
    usePortfolioQuotes,
    useQuoteStats,
    useRateLimits,
    usePriceComparison,
};
