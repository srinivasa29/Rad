import api from './api';

export const getHistoricalOHLC = async (symbol, timeframe = '1d', limit = 365) => {
  const res = await api.get(`/ohlc/${encodeURIComponent(symbol)}`, { params: { timeframe, limit } });
  return res.data;
};

export const getLatestCandle = async (symbol, timeframe = '1d') => {
  const res = await api.get(`/ohlc/${encodeURIComponent(symbol)}/latest`, { params: { timeframe } });
  return res.data;
};

export const getAvailableSymbols = async (exchange) => {
  const res = await api.get('/ohlc/symbols/list', { params: { exchange } });
  return res.data;
};

export default {
  getHistoricalOHLC,
  getLatestCandle,
  getAvailableSymbols,
};
