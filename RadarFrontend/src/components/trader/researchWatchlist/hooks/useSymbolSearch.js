import { useEffect, useRef, useState } from 'react';
import { searchSymbols } from '../services/watchlistMarketService';

export const useSymbolSearch = (query, { enabled = true, limit = 8 } = {}) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    const q = String(query || '').trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    const id = ++requestId.current;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const items = await searchSymbols(q, limit);
        if (requestId.current === id) setResults(items);
      } catch {
        if (requestId.current === id) setResults([]);
      } finally {
        if (requestId.current === id) setLoading(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query, enabled, limit]);

  return { results, loading };
};
