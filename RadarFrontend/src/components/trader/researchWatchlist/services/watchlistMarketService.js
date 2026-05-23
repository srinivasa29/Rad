import {
  fetchMarketData,
  fetchMarketHistory,
  fetchMarketNews,
  fetchMarketQuotes,
  fetchUniversalSymbolSearch,
  fetchWatchlistData,
} from '../../../../api/marketApi';
import { computeResearch, normalizeNews } from '../utils/computeResearch';
import { normalizeSymbol, withNseSuffix } from '../utils/formatters';

const MOCK_SOURCES = new Set(['mock', 'fallback', 'synthetic', 'generated']);

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export const isLiveQuote = (quote) => {
  const src = String(quote?.priceSource || quote?.source || '').toLowerCase();
  if (MOCK_SOURCES.has(src) || src.includes('mock')) return false;
  const price = Number(quote?.price ?? quote?.ltp ?? 0);
  return Number.isFinite(price) && price > 0;
};

export const normalizeQuote = (raw = {}, symbol) => {
  const sym = normalizeSymbol(symbol || raw.symbol);
  const price = toNumberOrNull(raw.price ?? raw.ltp ?? raw.close ?? raw.current);
  const changePercent = toNumberOrNull(
    raw.changePercent ?? raw.percentChange ?? raw.regularMarketChangePercent,
  );
  const change = toNumberOrNull(raw.change);
  const resolvedChange = changePercent ?? change;
  return {
    symbol: sym,
    name: raw.name || raw.companyName || raw.shortName || sym,
    sector: raw.sector || raw.industry || raw.category || 'Equity',
    price,
    changePercent: resolvedChange,
    volume: toNumberOrNull(raw.volume ?? raw.regularMarketVolume),
    priceSource: raw.priceSource || raw.provider || raw.source || 'live',
    momentum: raw.momentum,
    timestamp: raw.timestamp,
  };
};

export const enrichWatchlistSymbol = async (symbol) => {
  const sym = normalizeSymbol(symbol);
  if (!sym) return null;
  try {
    const rawRows = await fetchWatchlistData([sym]);
    if (rawRows && rawRows.length > 0) {
      const row = rawRows[0];
      return {
        ...row,
        id: row.symbol,
        indicatorsReady: row.rsi !== null && row.macd?.histogram !== null,
      };
    }
  } catch (error) {
    console.error(`Failed to enrich symbol ${sym}:`, error);
  }
  return null;
};

export const enrichWatchlistSymbols = async (symbols) => {
  const clean = [...new Set((symbols || []).map(normalizeSymbol).filter(Boolean))];
  if (!clean.length) return [];
  try {
    const rawRows = await fetchWatchlistData(clean);
    return rawRows.map((row) => ({
      ...row,
      id: row.symbol,
      indicatorsReady: row.rsi !== null && row.macd?.histogram !== null,
    }));
  } catch (error) {
    console.error('Failed to enrich watchlist symbols:', error);
    return [];
  }
};

export const searchSymbols = async (query, limit = 8) => {
  const q = String(query || '').trim();
  if (!q) return [];

  let items = [];

  try {
    items = await fetchUniversalSymbolSearch(q, limit);
  } catch {
    items = [];
  }

  if (!Array.isArray(items)) items = [];

  items = items.filter((item) => {
    const type = String(item?.assetType || item?.type || 'stock').toLowerCase();
    return type === 'stock' || type === 'equity' || !item?.assetType;
  });

  if (items.length < 3) {
    try {
      const marketRows = await fetchMarketData({ search: q, type: 'STOCK' });
      const extra = (Array.isArray(marketRows) ? marketRows : [])
        .filter((row) => {
          const sym = normalizeSymbol(row.symbol);
          return sym && !items.some((i) => normalizeSymbol(i.symbol) === sym);
        })
        .slice(0, limit)
        .map((row) => ({
          symbol: normalizeSymbol(row.symbol),
          name: row.name || row.companyName,
          exchange: row.exchange || 'NSE',
          assetType: 'stock',
          sector: row.sector || row.industry,
          price: Number(row.price ?? 0),
          changePercent: Number(row.changePercent ?? row.change ?? 0),
        }));
      items = [...items, ...extra].slice(0, limit);
    } catch {
      // keep registry results only
    }
  }

  if (items.length) {
    try {
      const symbols = items.map((i) => withNseSuffix(i.symbol));
      const quotes = await fetchMarketQuotes(symbols, { strictLive: false });
      const map = new Map(quotes.map((quote) => [normalizeSymbol(quote.symbol), normalizeQuote(quote)]));
      return items.map((item) => {
        const live = map.get(normalizeSymbol(item.symbol));
        if (!live || !isLiveQuote(live)) return { ...item, exchange: item.exchange || 'NSE' };
        return {
          ...item,
          name: live.name || item.name,
          price: live.price,
          changePercent: live.changePercent,
          sector: live.sector || item.sector,
          exchange: item.exchange || 'NSE',
          priceSource: live.priceSource,
        };
      });
    } catch {
      return items.map((item) => ({ ...item, exchange: item.exchange || 'NSE' }));
    }
  }

  return items;
};
