const SECTOR_MAP = {
  RELIANCE: 'Energy',
  HDFCBANK: 'Banking',
  ICICIBANK: 'Banking',
  SBIN: 'Banking',
  INFY: 'IT',
  TCS: 'IT',
  HCLTECH: 'IT',
  LT: 'Infra',
  ITC: 'FMCG',
  TATAMOTORS: 'Auto',
  MARUTI: 'Auto',
  SUNPHARMA: 'Pharma',
  AXISBANK: 'Banking',
  TITAN: 'Consumer',
};

const BASE_PRICES = {
  NIFTY: 25120,
  BANKNIFTY: 56540,
  RELIANCE: 1436,
  HDFCBANK: 1978,
  INFY: 1524,
  TCS: 3890,
  ICICIBANK: 1452,
  SBIN: 812,
  ITC: 438,
  LT: 3560,
  TATAMOTORS: 706,
  SUNPHARMA: 1722,
  AXISBANK: 1174,
  MARUTI: 12640,
  TITAN: 3488,
};

const normalizeRadarSymbol = (symbol) => String(symbol || 'RELIANCE')
  .trim()
  .toUpperCase()
  .replace(/^NSE:/, '')
  .replace(/\.(NS|BO)$/i, '')
  .replace(/\s+/g, '');

const seededRandom = (seed) => {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return () => {
    hash += 0x6D2B79F5;
    let value = hash;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const previousTradingDay = (date = new Date()) => {
  const cursor = new Date(date);
  cursor.setHours(15, 30, 0, 0);
  do {
    cursor.setDate(cursor.getDate() - 1);
  } while ([0, 6].includes(cursor.getDay()));
  return cursor;
};

const generateMockCandles = (symbol, interval = '5min', count = 180) => {
  const normalized = normalizeRadarSymbol(symbol);
  const random = seededRandom(`${normalized}-${interval}-${new Date().toISOString().slice(0, 10)}`);
  const base = BASE_PRICES[normalized] || 900 + random() * 2600;
  const end = previousTradingDay();
  const intervalMinutes = interval.includes('1min') ? 1 : interval.includes('15') ? 15 : interval.includes('30') ? 30 : interval.includes('1h') ? 60 : interval.includes('day') ? 1440 : 5;
  const candles = [];
  let close = base * (0.985 + random() * 0.03);
  let drift = (random() - 0.46) * 0.0018;

  for (let index = count - 1; index >= 0; index -= 1) {
    const time = new Date(end.getTime() - index * intervalMinutes * 60000);
    const pulse = Math.sin((count - index) / 10) * 0.0016;
    const noise = (random() - 0.5) * 0.006;
    const open = close;
    close = Math.max(1, close * (1 + drift + pulse + noise));
    const spread = close * (0.0015 + random() * 0.006);
    const high = Math.max(open, close) + spread;
    const low = Math.min(open, close) - spread;
    const volume = Math.round((250000 + random() * 1800000) * (1 + Math.abs(noise) * 55));
    candles.push({
      time: Math.floor(time.getTime() / 1000),
      timestamp: time.toISOString(),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });
    drift *= 0.997;
  }
  return candles;
};

const nextTickFromCandle = (symbol, lastCandle, index = 0) => {
  const normalized = normalizeRadarSymbol(symbol);
  const random = seededRandom(`${normalized}-${Math.floor(Date.now() / 3000)}-${index}`);
  const pulse = Math.sin(Date.now() / 9000 + index) * 0.0009;
  const move = pulse + (random() - 0.5) * 0.0016;
  const close = Number((Number(lastCandle.close) * (1 + move)).toFixed(2));
  const high = Number(Math.max(lastCandle.high, close).toFixed(2));
  const low = Number(Math.min(lastCandle.low, close).toFixed(2));
  return {
    ...lastCandle,
    symbol: normalized,
    time: Math.floor(Date.now() / 1000),
    timestamp: new Date().toISOString(),
    high,
    low,
    close,
    volume: Math.round(Number(lastCandle.volume || 0) * (0.96 + random() * 0.1)),
    simulated: true,
  };
};

const buildFnoSnapshot = (symbol, price) => {
  const normalized = normalizeRadarSymbol(symbol);
  const random = seededRandom(`fno-${normalized}-${new Date().toISOString().slice(0, 10)}`);
  const pcr = Number((0.72 + random() * 0.72).toFixed(2));
  const maxPainStep = price > 2000 ? 100 : 20;
  const maxPain = Math.round((price * (0.985 + random() * 0.03)) / maxPainStep) * maxPainStep;
  return {
    pcr,
    maxPain,
    ivPercentile: Math.round(28 + random() * 52),
    longBuildup: Math.round(35 + random() * 55),
    shortCovering: Math.round(20 + random() * 60),
    oi: Array.from({ length: 7 }, (_, index) => {
      const strike = maxPain + (index - 3) * maxPainStep;
      return {
        strike,
        callOi: Math.round(120000 + random() * 700000),
        putOi: Math.round(120000 + random() * 700000),
      };
    }),
    source: 'simulated-options-chain',
  };
};

module.exports = {
  BASE_PRICES,
  SECTOR_MAP,
  normalizeRadarSymbol,
  generateMockCandles,
  nextTickFromCandle,
  buildFnoSnapshot,
};
