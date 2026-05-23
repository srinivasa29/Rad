const axios = require('axios');
const cache = require('../cache/radarMemoryCache');
const marketHoursService = require('./marketHoursService');
const newsService = require('./newsService');
const { getUniqueUniverse } = require('../config/marketUniverse');
const { calculateIndicators } = require('../indicators/radarIndicators');
const {
  SECTOR_MAP,
  normalizeRadarSymbol,
  generateMockCandles,
  nextTickFromCandle,
  buildFnoSnapshot,
} = require('../utils/radarMockMarket');

const TWELVE_DATA_API_KEY = process.env.TWELVE_API_KEY || 'f07be5e2e09a439699db2da9f8b53dfd';
const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com';
const DEFAULT_SYMBOLS = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'HDFCBANK', 'INFY', 'TCS', 'ICICIBANK', 'SBIN', 'ITC', 'LT'];

const intervalMap = {
  '1m': '1min',
  '5m': '5min',
  '15m': '15min',
  '30m': '30min',
  '1h': '1h',
  '1d': '1day',
  'D': '1day',
};

const toTwelveSymbol = (symbol) => {
  const normalized = normalizeRadarSymbol(symbol);
  if (normalized === 'NIFTY' || normalized === 'NIFTY50') return 'NIFTY';
  if (normalized === 'BANKNIFTY') return 'BANKNIFTY';
  return `${normalized}.NSE`;
};

const round = (value, digits = 2) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Number(numeric.toFixed(digits)) : 0;
};

const requestTwelveData = async (path, params = {}, retries = 1) => {
  const key = `td:${path}:${JSON.stringify(params)}`;
  const ttl = path === 'price' ? 15000 : path === 'quote' ? 30000 : 120000;
  return cache.remember(key, ttl, async () => {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const response = await axios.get(`${TWELVE_DATA_BASE_URL}/${path}`, {
          params: { ...params, apikey: TWELVE_DATA_API_KEY },
          timeout: 8000,
        });
        if (response.data?.status === 'error') {
          throw new Error(response.data.message || 'Twelve Data returned an error');
        }
        return response.data;
      } catch (error) {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
      }
    }
    throw lastError;
  });
};

const normalizeCandle = (candle) => {
  const timestamp = candle.datetime || candle.timestamp;
  const time = timestamp
    ? Math.floor(new Date(timestamp).getTime() / 1000)
    : Math.floor(Date.now() / 1000);
  return {
    time,
    timestamp: new Date(time * 1000).toISOString(),
    open: round(candle.open),
    high: round(candle.high),
    low: round(candle.low),
    close: round(candle.close),
    volume: Math.round(Number(candle.volume || 0)),
  };
};

const getCandles = async (symbol, interval = '5m', outputsize = 180) => {
  const normalized = normalizeRadarSymbol(symbol);
  const tdInterval = intervalMap[interval] || intervalMap['5m'];
  const cacheKey = `radar:candles:${normalized}:${tdInterval}:${outputsize}`;
  const market = marketHoursService.getMarketStatus();

  try {
    const data = await requestTwelveData('time_series', {
      symbol: toTwelveSymbol(normalized),
      interval: tdInterval,
      outputsize,
      timezone: 'Asia/Kolkata',
    });
    const candles = (data.values || [])
      .map(normalizeCandle)
      .filter((item) => item.time && item.close)
      .sort((a, b) => a.time - b.time);
    if (!candles.length) throw new Error('No candle values returned');
    return cache.set(cacheKey, { candles, source: 'twelvedata' }, market.isOpen ? 45000 : 180000);
  } catch (error) {
    const stale = cache.getStale(cacheKey);
    if (stale?.candles?.length) return { ...stale, source: 'cache-fallback' };
    return { candles: generateMockCandles(normalized, tdInterval, outputsize), source: 'simulated-replay' };
  }
};

const getQuote = async (symbol) => {
  const normalized = normalizeRadarSymbol(symbol);
  const market = marketHoursService.getMarketStatus();
  try {
    const data = await requestTwelveData('quote', { symbol: toTwelveSymbol(normalized) });
    const quote = {
      symbol: normalized,
      name: data.name || normalized,
      price: round(data.close || data.price),
      open: round(data.open),
      high: round(data.high),
      low: round(data.low),
      previousClose: round(data.previous_close),
      change: round(data.change),
      changePercent: round(data.percent_change),
      volume: Math.round(Number(data.volume || 0)),
      sector: SECTOR_MAP[normalized] || 'Index',
      source: 'twelvedata',
      marketMode: market.isOpen ? 'LIVE' : 'CLOSED_REPLAY',
      updatedAt: new Date().toISOString(),
    };
    return cache.set(`radar:quote:${normalized}`, quote, market.isOpen ? 15000 : 90000);
  } catch (error) {
    const stale = cache.getStale(`radar:quote:${normalized}`);
    if (stale) return { ...stale, source: 'cache-fallback', marketMode: market.isOpen ? 'LIVE' : 'CLOSED_REPLAY' };
    const candles = generateMockCandles(normalized, '5min', 80);
    const last = candles.at(-1);
    const prev = candles.at(-2) || last;
    const change = last.close - prev.close;
    return {
      symbol: normalized,
      name: normalized,
      price: last.close,
      open: last.open,
      high: last.high,
      low: last.low,
      previousClose: prev.close,
      change: round(change),
      changePercent: round((change / prev.close) * 100),
      volume: last.volume,
      sector: SECTOR_MAP[normalized] || 'Index',
      source: 'simulated',
      marketMode: market.isOpen ? 'LIVE_FALLBACK' : 'CLOSED_REPLAY',
      updatedAt: new Date().toISOString(),
    };
  }
};

const buildSymbolResearch = async (symbol, interval = '5m') => {
  const normalized = normalizeRadarSymbol(symbol);
  const [{ candles, source }, quote] = await Promise.all([
    getCandles(normalized, interval, 220),
    getQuote(normalized),
  ]);
  const indicators = calculateIndicators(candles);
  const market = marketHoursService.getMarketStatus();
  const last = candles.at(-1);
  const replayTick = market.isOpen ? null : nextTickFromCandle(normalized, last);

  return {
    symbol: normalized,
    quote,
    candles,
    indicators,
    fno: buildFnoSnapshot(normalized, quote.price || last?.close || 1000),
    market: {
      ...market,
      mode: market.isOpen ? 'LIVE' : 'CLOSED_REPLAY',
      badge: market.isOpen ? 'MARKET LIVE' : 'MARKET CLOSED',
      lastSessionSummary: {
        close: last?.close || quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: last?.volume || quote.volume,
        source,
      },
    },
    replayTick,
  };
};

const getDashboard = async (symbols = DEFAULT_SYMBOLS, interval = '5m') => {
  const uniqueSymbols = [...new Set(symbols.map(normalizeRadarSymbol).filter(Boolean))].slice(0, 20);
  const rows = await Promise.all(uniqueSymbols.map((symbol) => buildSymbolResearch(symbol, interval)));
  const watchlist = rows.map((row) => ({
    symbol: row.symbol,
    sector: row.quote.sector,
    price: row.quote.price,
    change: row.quote.change,
    changePercent: row.quote.changePercent,
    volume: row.quote.volume,
    bias: row.indicators.snapshot.bias,
    momentumScore: row.indicators.snapshot.momentumScore,
    trendStrength: row.indicators.snapshot.trendStrength,
    volumeShock: row.indicators.snapshot.volumeShock,
    rsi: row.indicators.snapshot.rsi,
    source: row.quote.source,
  }));

  const sectors = Object.values(watchlist.reduce((acc, item) => {
    const key = item.sector || 'Other';
    if (!acc[key]) acc[key] = { sector: key, count: 0, change: 0, strength: 0 };
    acc[key].count += 1;
    acc[key].change += item.changePercent;
    acc[key].strength += item.trendStrength;
    return acc;
  }, {})).map((item) => ({
    ...item,
    change: round(item.change / item.count),
    strength: round(item.strength / item.count, 0),
  })).sort((a, b) => b.strength - a.strength);

  const insights = rows.flatMap((row) => row.indicators.insights.map((insight) => ({ ...insight, symbol: row.symbol }))).slice(0, 12);
  const market = marketHoursService.getMarketStatus();

  return {
    market: {
      ...market,
      mode: market.isOpen ? 'LIVE' : 'CLOSED_REPLAY',
      badge: market.isOpen ? 'MARKET LIVE' : 'MARKET CLOSED',
      nextEvent: marketHoursService.getTimeUntilNextEvent(),
    },
    universeSize: getUniqueUniverse().length,
    watchlist,
    sectors,
    insights,
    chart: rows[0],
    scanners: {
      gainers: [...watchlist].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5),
      losers: [...watchlist].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5),
      volumeShockers: [...watchlist].sort((a, b) => b.volumeShock - a.volumeShock).slice(0, 5),
      breakouts: watchlist.filter((item) => item.bias === 'bullish' && item.trendStrength > 60).slice(0, 8),
      rsiHeatmap: watchlist.map((item) => ({ symbol: item.symbol, rsi: item.rsi, bias: item.rsi > 60 ? 'hot' : item.rsi < 35 ? 'cool' : 'neutral' })),
    },
    fno: rows[0]?.fno,
    news: await getNews(),
    updatedAt: new Date().toISOString(),
  };
};

const getNews = async () => {
  try {
    const news = await newsService.getMarketNews?.({ limit: 10 });
    const rows = Array.isArray(news) ? news : news?.articles || news?.data || [];
    if (rows.length) {
      return rows.slice(0, 10).map((item, index) => normalizeNews(item, index));
    }
  } catch (error) {
    // Fall through to realistic desk headlines.
  }
  return [
    'Nifty futures indicate range-bound open as global yields stay firm',
    'Private banks see selective accumulation near support zones',
    'IT stocks stabilize after recent profit booking',
    'Energy counters active as crude volatility remains elevated',
    'Options desk notes call writing near upper weekly resistance',
  ].map((title, index) => normalizeNews({ title, source: 'RADAR Desk' }, index));
};

const normalizeNews = (item, index) => {
  const title = item.title || item.headline || 'Market update';
  const lower = title.toLowerCase();
  const sentiment = lower.includes('gain') || lower.includes('buy') || lower.includes('accumulation') || lower.includes('support')
    ? 'positive'
    : lower.includes('fall') || lower.includes('weak') || lower.includes('pressure') || lower.includes('decline')
      ? 'negative'
      : 'neutral';
  return {
    id: item.url || `${Date.now()}-${index}`,
    title,
    source: item.source?.name || item.source || 'RADAR Desk',
    publishedAt: item.publishedAt || item.datetime || new Date(Date.now() - index * 11 * 60000).toISOString(),
    sentiment,
    breaking: index < 2,
    url: item.url || null,
  };
};

module.exports = {
  DEFAULT_SYMBOLS,
  buildSymbolResearch,
  getDashboard,
  getQuote,
  getCandles,
};
