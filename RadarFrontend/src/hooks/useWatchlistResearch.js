import { useState, useEffect, useCallback } from 'react';
import { fetchUserWatchlist } from '../api/watchlistApi';
import { fetchBatchQuotes } from '../api/quotesApi';
import researchApi from '../api/researchApi';
import { computeIndicators, generateSignals } from '../utils/indicators';

export const useWatchlistResearch = () => {
  const [symbols, setSymbols] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const userList = await fetchUserWatchlist('trader');
      setSymbols(userList || []);

      if ((userList || []).length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      const batch = await fetchBatchQuotes(userList);

      // For each symbol, compute indicators locally and enrich row
      const enriched = await Promise.all((userList || []).map(async (s) => {
        const quote = batch.quotes?.[s] || {};
        const history = await researchApi.fetchHistory(s).catch(()=>[]);
        const indicators = computeIndicators(history || []);
        const signals = generateSignals(indicators, history || []);
        const sentiment = await researchApi.fetchNewsSentiment(s).catch(()=> 'Neutral');

        // compute changePercent if provider didn't return it
        let cp = quote.changePercent;
        if ((cp === null || cp === undefined) && quote.price != null && quote.previousClose != null) {
          const prev = Number(quote.previousClose);
          if (prev !== 0) cp = ((Number(quote.price) - prev) / Math.abs(prev)) * 100;
        }

        return {
          symbol: s,
          price: quote.price || null,
          changePercent: cp != null ? cp : null,
          volume: quote.volume || null,
          rsi: indicators.rsi,
          ema20: indicators.ema20,
          ema50: indicators.ema50,
          macd: indicators.macd,
          atr: indicators.atr,
          vwap: indicators.vwap,
          trend: indicators.trend,
          signal: signals.primary,
          alerts: signals.alerts,
          sentiment,
          spark: history.slice(-20).map(h=>h.price||0),
        };
      }));

      setRows(enriched);
    } catch (error) {
      console.error('useWatchlistResearch load error', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(()=>{ load(); }, [load]);

  return { symbols, rows, loading, refresh: load };
};

export default useWatchlistResearch;
