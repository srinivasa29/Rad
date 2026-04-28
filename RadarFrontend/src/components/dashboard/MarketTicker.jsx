import { useState, useEffect } from 'react';
import './MarketTicker.css';
import { fetchMarketData, fetchMarketHistory } from '../../api/marketApi';
import { useSocket } from '../../hooks/useSocket';
import { getCurrencySymbol } from '../../utils/currency';

const displaySymbol = (value) => String(value || '').replace(/\.(NS|BO)$/i, '');
const formatPercent = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0.00%';
  return `${numeric > 0 ? '+' : ''}${numeric.toFixed(2)}%`;
};

const normalizeTickerRow = (item) => {
  const price = Number(item?.price || item?.ltp || item?.lastPrice || 0);
  const change = Number(item?.changePercent ?? item?.change_24h ?? item?.change ?? 0);
  return {
    symbol: displaySymbol(item?.symbol || item?.name).substring(0, 14),
    price: Number.isFinite(price) ? price.toLocaleString() : '0',
    change: Number.isFinite(change) ? change : 0,
    isIndex: false,
    type: item?.type || 'STOCK',
  };
};

const BENCHMARK_INDEXES = [
  { label: 'NIFTY 50', backendSymbol: '^NSEI' },
  { label: 'BANKNIFTY', backendSymbol: '^NSEBANK' },
  { label: 'SENSEX', backendSymbol: '^BSESN' },
];

const getBenchmarksFromHistory = async () => {
  const settled = await Promise.allSettled(
    BENCHMARK_INDEXES.map(async (item) => {
      const response = await fetchMarketHistory(item.backendSymbol, 'STOCK', '1D');
      const points = Array.isArray(response?.data) ? response.data : [];
      const current = Number(points[points.length - 1]?.close || 0);
      const previous = Number(points[points.length - 2]?.close || 0);

      if (!Number.isFinite(current) || current <= 0 || !Number.isFinite(previous) || previous <= 0) {
        return null;
      }

      const change = ((current - previous) / previous) * 100;
      return {
        symbol: item.label,
        price: current.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        change: Number.isFinite(change) ? change : 0,
        isIndex: true,
      };
    })
  );

  return settled
    .filter((entry) => entry.status === 'fulfilled')
    .map((entry) => entry.value)
    .filter(Boolean);
};

const rotateRows = (rows, count, offset) => {
  if (!Array.isArray(rows) || rows.length === 0 || count <= 0) {
    return [];
  }

  if (rows.length <= count) {
    return rows.slice(0, count);
  }

  const start = offset % rows.length;
  const ordered = [...rows.slice(start), ...rows.slice(0, start)];
  return ordered.slice(0, count);
};

const ensureMinimumRows = (rows, minimum = 20) => {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  if (rows.length >= minimum) return rows;

  const expanded = [...rows];
  let cursor = 0;
  while (expanded.length < minimum) {
    expanded.push(rows[cursor % rows.length]);
    cursor += 1;
  }
  return expanded;
};

const MarketTicker = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const [stocks, setStocks] = useState([]);

  const [error, setError] = useState(false);
  const [rotationOffset, setRotationOffset] = useState(0);

  const { on } = useSocket(['ticker']);

  useEffect(() => {
    let isMounted = true;

    const loadInitial = async () => {
      try {
        if (isMounted) {
          setError(false);
          setIsLoading(true);
        }
        const res = await fetchMarketData({ type: 'STOCK', sort: 'gainers' });
        const benchmarks = await getBenchmarksFromHistory();
        const movers = (Array.isArray(res) ? res : [])
              .map((item) => normalizeTickerRow(item))
              .filter((item) => item.symbol);

        const benchmarkSymbols = new Set(benchmarks.map((item) => item.symbol));
        const cleanMovers = movers.filter((item) => !benchmarkSymbols.has(item.symbol));
        const rotated = rotateRows(cleanMovers, cleanMovers.length, rotationOffset);
        const mergedRows = ensureMinimumRows([...benchmarks, ...rotated], 20);

        if (mergedRows.length > 0 && isMounted) {
          setStocks(mergedRows);
          setLastUpdatedAt(new Date());
        }
      } catch (err) {
          console.error("Ticker initial load failed:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadInitial();
    
    // Subscribe to realtime updates
    on('indexUpdate', (indices) => {
      if (!isMounted) return;
      setStocks(prev => {
        const next = [...prev];
        indices.forEach(idx => {
          const target = next.findIndex(s => s.symbol === idx.name);
          if (target !== -1) {
            const numericPrice = Number(idx.value);
            next[target] = {
              ...next[target],
              price: Number.isFinite(numericPrice)
                ? numericPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })
                : String(idx.value),
              change: parseFloat(idx.change),
            };
          }
        });
        return next;
      });
      setLastUpdatedAt(new Date());
    });

    on('price_update', (event) => {
        if (!isMounted || !event.symbol) return;
        setStocks(prev => {
            const target = prev.findIndex(s => s.symbol === event.symbol || s.symbol === displaySymbol(event.symbol));
            if (target !== -1) {
                const next = [...prev];
                const numericPrice = Number(event.price);
                next[target] = { 
                    ...next[target], 
                    price: Number.isFinite(numericPrice)
                      ? numericPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })
                      : String(event.price),
                    change: event.change,
                };
                return next;
            }
            return prev;
        });
    });

    return () => {
      isMounted = false;
    };
  }, [on]);

  const tickerSequence = stocks.map((item, idx) => ({
    key: `${item.symbol}-${idx}`,
    item,
  }));
  // Triple (not double) so the loop feels longer before repeating
  const loopingSequence = [...tickerSequence, ...tickerSequence, ...tickerSequence];
  // Scale duration to content: 5s per unique symbol, min 30s
  const scrollDuration = Math.max(30, tickerSequence.length * 5);

  return (
    <div className="market-ticker-shell">
      <div className="market-ticker-container">
        <div
          className="ticker-center-scroll-wrap"
          style={{ '--ticker-duration': `${scrollDuration}s` }}
        >
          <div className="ticker-center-fade ticker-center-fade--left" aria-hidden="true"></div>
          <div
            className="ticker-track ticker-wrapper-track ticker-wrapper-track--animated"
            role="list"
            aria-label="Market ticker"
          >
          {loopingSequence.map((entry, idx) => {
            const s = entry.item;
            const direction = s.change > 0 ? '▲' : s.change < 0 ? '▼' : '•';
            return (
              <div className="ticker-item ticker-item-simple" key={`${entry.key}-${idx}`} role="listitem" aria-hidden={idx >= tickerSequence.length}>
                <span className="symbol ticker-sym">{s.symbol}</span>
                <span className="price ticker-val">
                  {s.isIndex ? '' : getCurrencySymbol(s.type, s.symbol)}{s.price}
                </span>
                <span className={`ticker-chg ${s.change > 0 ? 'up green' : s.change < 0 ? 'down red' : ''}`}>
                    <span className="ticker-chg-arrow" aria-hidden="true">{direction}</span>
                    {formatPercent(s.change)}
                </span>
              </div>
            );
          })}
          </div>
          <div className="ticker-center-fade ticker-center-fade--right" aria-hidden="true"></div>
        </div>
      </div>
    </div>
  );
};

export default MarketTicker;
