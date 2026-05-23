const candleEngine = require('./candleEngine');
const symbolAdapter = require('../utils/symbolAdapter');

const mapPeriodToIntervalAndRange = (period) => {
  const p = String(period || '1y').toLowerCase().trim();
  if (p === '1d') {
    return { interval: '15m', range: '5d' };
  }
  if (p === '5d') {
    return { interval: '15m', range: '5d' };
  }
  if (p === '1m' || p === '1mo') {
    return { interval: '1d', range: '1mo' };
  }
  if (p === '3m' || p === '3mo') {
    return { interval: '1d', range: '3mo' };
  }
  if (p === '6m' || p === '6mo') {
    return { interval: '1d', range: '6mo' };
  }
  if (p === '1y') {
    return { interval: '1d', range: '1y' };
  }
  return { interval: '1d', range: '1y' };
};

const getHistoricalData = async (symbol, period = '1y') => {
  const { interval, range } = mapPeriodToIntervalAndRange(period);
  return await candleEngine.getHistoricalData(symbol, interval, range);
};

module.exports = {
  getHistoricalData,
  normalizeSymbolForYahoo: symbolAdapter.toYahoo
};
