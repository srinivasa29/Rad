import api from './api';

const toNumberSafe = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const normalizeHistoryArray = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map((h) => {
    const price = toNumberSafe(h.price ?? h.close ?? h.adjclose ?? h.adjustedClose ?? h.c);
    const open = toNumberSafe(h.open ?? h.o);
    const high = toNumberSafe(h.high ?? h.h);
    const low = toNumberSafe(h.low ?? h.l);
    const volume = toNumberSafe(h.volume ?? h.v ?? h.vol ?? 0);
    const timestamp = h.timestamp ?? h.date ?? h.time ?? h.t ?? null;
    return { price, open, high, low, volume, timestamp };
  }).filter(x => x.price !== null);
};

const fetchHistory = async (symbol) => {
  try {
    // Prefer technical summary (fast, may include precomputed history)
    const res = await api.get(`/technical/summary/stock/${encodeURIComponent(symbol)}`);
    const indicators = res.data?.indicators || null;
    // Some backends include a history array under indicators.history — use it if present
    if (Array.isArray(indicators?.history) && indicators.history.length > 0) {
      return normalizeHistoryArray(indicators.history);
    }
    // Otherwise fall back to market OHLC history endpoint which returns `prices`
    const histResp = await api.get(`/market/history?symbol=${encodeURIComponent(symbol)}&type=STOCK&interval=1D`);
    if (Array.isArray(histResp.data?.prices) && histResp.data.prices.length > 0) {
      return normalizeHistoryArray(histResp.data.prices);
    }
    return [];
  } catch (err) {
    try {
      const resp = await api.get(`/market/history?symbol=${encodeURIComponent(symbol)}&type=STOCK&interval=1D`);
      return normalizeHistoryArray(resp.data?.prices || []);
    } catch (e) {
      return [];
    }
  }
};

const fetchNewsSentiment = async (symbol) => {
  try {
    const resp = await api.get(`/news/sentiment/${encodeURIComponent(symbol)}`);
    return resp.data?.sentiment || 'Neutral';
  } catch (err) {
    return 'Neutral';
  }
};

export default { fetchHistory, fetchNewsSentiment };
