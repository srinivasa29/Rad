const {
  EMA,
  SMA,
  RSI,
  MACD,
  BollingerBands,
  ATR,
} = require('technicalindicators');

const round = (value, digits = 2) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Number(numeric.toFixed(digits)) : null;
};

const alignLine = (candles, values, offset) => values.map((value, index) => ({
  time: candles[index + offset]?.time,
  value: round(value, 4),
})).filter((point) => point.time && Number.isFinite(point.value));

const calculateIndicators = (candles = []) => {
  const rows = candles
    .filter((candle) => Number.isFinite(Number(candle.close)))
    .sort((a, b) => Number(a.time) - Number(b.time));

  const close = rows.map((item) => Number(item.close));
  const high = rows.map((item) => Number(item.high));
  const low = rows.map((item) => Number(item.low));
  const volume = rows.map((item) => Number(item.volume || 0));

  const ema20Raw = EMA.calculate({ period: 20, values: close });
  const ema50Raw = EMA.calculate({ period: 50, values: close });
  const sma20Raw = SMA.calculate({ period: 20, values: close });
  const rsiRaw = RSI.calculate({ period: 14, values: close });
  const macdRaw = MACD.calculate({
    values: close,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const bbRaw = BollingerBands.calculate({ period: 20, values: close, stdDev: 2 });
  const atrRaw = ATR.calculate({ period: 14, high, low, close });

  const latestClose = close.at(-1) || 0;
  const latestEma20 = ema20Raw.at(-1) || latestClose;
  const latestEma50 = ema50Raw.at(-1) || latestClose;
  const latestRsi = rsiRaw.at(-1) || 50;
  const latestMacd = macdRaw.at(-1) || { MACD: 0, signal: 0, histogram: 0 };
  const avgVolume = volume.slice(-20).reduce((sum, value) => sum + value, 0) / Math.max(1, volume.slice(-20).length);
  const latestVolume = volume.at(-1) || avgVolume;
  const recentHigh = Math.max(...high.slice(-20), latestClose);
  const recentLow = Math.min(...low.slice(-20), latestClose);
  const momentum = close.length > 10 && close.at(-11)
    ? ((latestClose - close.at(-11)) / close.at(-11)) * 100
    : 0;

  const trendStrength = Math.min(100, Math.max(0,
    50
    + (latestClose > latestEma20 ? 12 : -12)
    + (latestEma20 > latestEma50 ? 16 : -16)
    + Math.max(-18, Math.min(18, momentum * 3))
    + (latestMacd.histogram > 0 ? 8 : -8)
  ));
  const momentumScore = Math.min(100, Math.max(0, 50 + momentum * 6 + (latestRsi - 50) * 0.7));
  const volumeShock = avgVolume > 0 ? latestVolume / avgVolume : 1;
  const breakout = latestClose >= recentHigh * 0.995;
  const breakdown = latestClose <= recentLow * 1.005;
  const bullishVotes = [
    latestClose > latestEma20,
    latestEma20 > latestEma50,
    latestMacd.histogram > 0,
    latestRsi >= 52,
    momentum > 0,
  ].filter(Boolean).length;
  const bearishVotes = [
    latestClose < latestEma20,
    latestEma20 < latestEma50,
    latestMacd.histogram < 0,
    latestRsi <= 48,
    momentum < 0,
  ].filter(Boolean).length;

  const insights = [];
  if (breakout && volumeShock > 1.1) insights.push({ type: 'Bullish breakout', tone: 'bullish', detail: `Price testing 20-candle high with ${round(volumeShock, 1)}x volume.` });
  if (latestMacd.histogram > 0 && (macdRaw.at(-2)?.histogram || 0) <= 0) insights.push({ type: 'MACD crossover', tone: 'bullish', detail: 'MACD histogram crossed above signal momentum.' });
  if (latestRsi < 32) insights.push({ type: 'RSI oversold', tone: 'bullish', detail: `RSI at ${round(latestRsi, 1)} indicates mean-reversion watch.` });
  if (volumeShock > 1.6) insights.push({ type: 'Volume spike', tone: latestClose >= rows.at(-2)?.close ? 'bullish' : 'bearish', detail: `Volume is ${round(volumeShock, 1)}x the 20-candle average.` });
  if (latestEma20 > latestEma50 && (ema20Raw.at(-2) || 0) <= (ema50Raw.at(-2) || 0)) insights.push({ type: 'EMA crossover', tone: 'bullish', detail: 'EMA 20 moved above EMA 50.' });
  if (breakdown && volumeShock > 1.1) insights.push({ type: 'Bearish breakdown', tone: 'bearish', detail: 'Price is losing the lower range with elevated activity.' });
  if (!insights.length && bullishVotes >= bearishVotes) {
    insights.push({ type: 'Bullish bias', tone: 'bullish', detail: `Trend score ${round(trendStrength, 0)}/100 with RSI near ${round(latestRsi, 1)}.` });
  }
  if (!insights.length) {
    insights.push({ type: 'Bearish bias', tone: 'bearish', detail: `Momentum remains soft with MACD histogram at ${round(latestMacd.histogram, 2)}.` });
  }

  return {
    overlays: {
      ema20: alignLine(rows, ema20Raw, 19),
      ema50: alignLine(rows, ema50Raw, 49),
      sma20: alignLine(rows, sma20Raw, 19),
      bollinger: bbRaw.map((value, index) => ({
        time: rows[index + 19]?.time,
        upper: round(value.upper, 4),
        middle: round(value.middle, 4),
        lower: round(value.lower, 4),
      })).filter((point) => point.time),
    },
    oscillators: {
      rsi: alignLine(rows, rsiRaw, 14),
      macd: macdRaw.map((value, index) => ({
        time: rows[index + 25]?.time,
        macd: round(value.MACD, 4),
        signal: round(value.signal, 4),
        histogram: round(value.histogram, 4),
      })).filter((point) => point.time),
      atr: alignLine(rows, atrRaw, 14),
    },
    snapshot: {
      rsi: round(latestRsi, 1),
      macd: round(latestMacd.MACD, 2),
      macdSignal: round(latestMacd.signal, 2),
      macdHistogram: round(latestMacd.histogram, 2),
      ema20: round(latestEma20),
      ema50: round(latestEma50),
      atr: round(atrRaw.at(-1), 2),
      momentum: round(momentum, 2),
      momentumScore: round(momentumScore, 0),
      trendStrength: round(trendStrength, 0),
      volumeShock: round(volumeShock, 2),
      support: round(recentLow),
      resistance: round(recentHigh),
      breakout,
      bias: bullishVotes > bearishVotes ? 'bullish' : bearishVotes > bullishVotes ? 'bearish' : 'neutral',
    },
    insights: insights.slice(0, 5),
  };
};

module.exports = { calculateIndicators };
