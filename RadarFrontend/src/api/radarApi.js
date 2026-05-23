import api from './api';

export const fetchRadarDashboard = async ({ symbols = [], interval = '5m' } = {}) => {
  const response = await api.get('/radar/dashboard', {
    params: {
      interval,
      symbols: symbols.join(','),
    },
  });
  return response.data?.data;
};

export const fetchRadarSymbol = async (symbol, interval = '5m') => {
  const response = await api.get(`/radar/symbol/${encodeURIComponent(symbol)}`, {
    params: { interval },
  });
  return response.data?.data;
};

export default {
  fetchRadarDashboard,
  fetchRadarSymbol,
};
