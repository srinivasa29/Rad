import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const mapIntervalToPeriod = (interval) => {
  const map = {
    '1D': '1d',
    '5D': '5d',
    '1M': '1m',
    '3M': '3m',
    '6M': '6m',
    '1Y': '1y',
    '5Y': '5y'
  };
  return map[String(interval).toUpperCase()] || '1y';
};

export const useCandles = (symbol, interval = '1D') => {
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCandles = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    setError(null);
    try {
      const periodParam = mapIntervalToPeriod(interval);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await axios.get(`/api/charts/${encodeURIComponent(symbol)}`, {
        params: { period: periodParam },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 12000,
      });

      if (res && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(c => {
          const t = Number(c.time || c.timestamp);
          let timeVal = isNaN(t) ? Math.floor(new Date(c.time || c.timestamp).getTime() / 1000) : t;
          if (timeVal > 9999999999) {
            timeVal = Math.floor(timeVal / 1000);
          }

          return {
            time: timeVal,
            open: Number(c.open || c.close),
            high: Number(c.high || c.close),
            low: Number(c.low || c.close),
            close: Number(c.close),
            volume: Number(c.volume || 0)
          };
        }).filter(item => item.time !== null && item.time !== undefined && !isNaN(item.time) && !isNaN(item.open) && !isNaN(item.close));

        // Sort chronologically
        mapped.sort((a, b) => a.time - b.time);

        // De-duplicate dates to satisfy lightweight-charts constraint
        const unique = [];
        const seen = new Set();
        for (const item of mapped) {
          if (!seen.has(item.time)) {
            seen.add(item.time);
            unique.push(item);
          }
        }

        setCandles(unique);
      } else {
        console.warn(`[useCandles] Empty response for ${symbol}`);
        setCandles([]);
      }
    } catch (err) {
      console.error(`[useCandles] Failed to load candles for ${symbol}:`, err.message);
      setError(err.message);
      setCandles([]);
    } finally {
      setLoading(false);
    }
  }, [symbol, interval]);

  useEffect(() => {
    loadCandles();
  }, [loadCandles]);

  return { candles, loading, error, refetch: loadCandles };
};

export default useCandles;
