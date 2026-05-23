import { EMA, MACD, RSI, SMA } from 'technicalindicators';

const MIN_RSI_BARS = 15;
const MIN_MACD_BARS = 35;

export const computeResearch = (quote, history) => {
  const candles = Array.isArray(history) ? history.filter((p) => Number(p.close) > 0) : [];
  const closes = candles.map((p) => Number(p.close));
  const highs = candles.map((p) => Number(p.high || p.close));
  const volumes = candles.map((p) => Number(p.volume || 0));

  const rsiSeries = closes.length >= MIN_RSI_BARS
    ? RSI.calculate({ values: closes, period: 14 })
    : [];
  const macdSeries = closes.length >= MIN_MACD_BARS
    ? MACD.calculate({
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    })
    : [];

  const ema20Series = closes.length >= 20 ? EMA.calculate({ values: closes, period: 20 }) : [];
  const ema50Series = closes.length >= 50 ? EMA.calculate({ values: closes, period: 50 }) : [];
  const ema20 = ema20Series.at(-1) ?? null;
  const ema50 = ema50Series.at(-1) ?? null;

  const avgVolume = volumes.length >= 20
    ? SMA.calculate({ values: volumes, period: 20 }).at(-1)
    : null;
  const recentHigh = highs.length >= 20 ? Math.max(...highs.slice(-20, -1)) : null;

  const rsiValue = rsiSeries.length ? Number(rsiSeries.at(-1)) : null;
  const macdPoint = macdSeries.at(-1) || null;
  const macdValue = macdPoint ? Number(macdPoint.MACD ?? 0) : null;
  const signalValue = macdPoint ? Number(macdPoint.signal ?? 0) : null;
  const histogram = macdPoint ? Number(macdPoint.histogram ?? 0) : null;

  const price = Number(quote?.price ?? closes.at(-1) ?? 0);
  const changePercent = Number(quote?.changePercent ?? quote?.change ?? 0);
  const latestVolume = Number(quote?.volume ?? volumes.at(-1) ?? 0);

  let trend = 'Sideways';
  if (ema20 != null && ema50 != null) {
    if (ema20 > ema50) trend = 'Bullish';
    else if (ema20 < ema50) trend = 'Bearish';
  }

  const signals = [];
  if (rsiValue != null) {
    if (rsiValue >= 70) signals.push('Overbought');
    else if (rsiValue <= 30) signals.push('Oversold');
  }
  if (histogram != null && histogram > 0 && trend === 'Bullish') signals.push('Bullish Momentum');
  if (histogram != null && histogram < 0 && trend === 'Bearish') signals.push('Bearish Momentum');
  if (avgVolume && latestVolume > avgVolume * 1.5) signals.push('Volume Spike');
  if (recentHigh && price > recentHigh && latestVolume >= (avgVolume || latestVolume) * 1.1) {
    signals.push('Breakout Candidate');
  }
  if (trend === 'Sideways' && signals.length === 0) signals.push('Sideways');

  let technicalSignal = 'Awaiting data';
  if (rsiValue != null && histogram != null) {
    technicalSignal = signals[0]
      || (histogram > 0 ? 'Positive MACD' : histogram < 0 ? 'Negative MACD' : 'Neutral');
  } else if (rsiValue != null) {
    technicalSignal = signals[0] || 'RSI only';
  }

  const momentum = Number(quote?.momentum ?? changePercent);
  const sentiment = momentum > 1 ? 'Positive' : momentum < -1 ? 'Negative' : 'Neutral';

  const indicatorsReady = rsiValue != null && histogram != null;

  return {
    rsi: rsiValue,
    ema20,
    ema50,
    macd: {
      value: macdValue ?? 0,
      signal: signalValue ?? 0,
      histogram: histogram ?? 0,
    },
    trend,
    signals,
    technicalSignal,
    sentiment,
    avgVolume,
    indicatorsReady,
  };
};

export const normalizeNews = (items) => (Array.isArray(items) ? items : [])
  .map((item, index) => ({
    id: item.id || item.url || `${item.headline || item.title || 'news'}-${index}`,
    title: item.headline || item.title || item.summary || 'Market update',
    source: item.source || item.publisher || 'Market news',
    url: item.url,
    sentiment: item.sentiment,
  }))
  .slice(0, 6);
