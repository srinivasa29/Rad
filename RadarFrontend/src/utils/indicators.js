// Lightweight local implementations of common indicators to avoid external dependency
// history: array of { date, price, open, high, low, volume }

const sma = (values, period) => {
  if (!values || values.length < period) return null;
  const slice = values.slice(-period);
  const sum = slice.reduce((s, v) => s + v, 0);
  return sum / period;
};

const emaLast = (values, period) => {
  if (!values || values.length < period) return null;
  const k = 2 / (period + 1);
  let ema = sma(values.slice(0, period), period);
  for (let i = period; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
  }
  return ema;
};

const computeRSI = (values, period = 14) => {
  if (!values || values.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff > 0) gains += diff; else losses += Math.abs(diff);
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

const computeMACD = (values, fast = 12, slow = 26, signal = 9) => {
  if (!values || values.length < slow) return null;
  const emaFast = []; const emaSlow = [];
  // compute EMAs progressively
  let kFast = 2 / (fast + 1);
  let kSlow = 2 / (slow + 1);
  let prevFast = sma(values.slice(0, fast), fast);
  let prevSlow = sma(values.slice(0, slow), slow);
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (i < fast - 1) { emaFast.push(null); }
    else if (i === fast - 1) { emaFast.push(prevFast); }
    else { prevFast = v * kFast + prevFast * (1 - kFast); emaFast.push(prevFast); }

    if (i < slow - 1) { emaSlow.push(null); }
    else if (i === slow - 1) { emaSlow.push(prevSlow); }
    else { prevSlow = v * kSlow + prevSlow * (1 - kSlow); emaSlow.push(prevSlow); }
  }
  const macdLine = values.map((_, i) => (emaFast[i] != null && emaSlow[i] != null) ? emaFast[i] - emaSlow[i] : null);
  const macdVals = macdLine.filter(v => v != null);
  if (macdVals.length < signal) return null;
  // compute signal line (EMA of macdVals)
  let sig = sma(macdVals.slice(0, signal), signal);
  for (let i = signal; i < macdVals.length; i++) {
    sig = macdVals[i] * (2 / (signal + 1)) + sig * (1 - (2 / (signal + 1)));
  }
  const lastMacd = macdVals[macdVals.length - 1];
  const histogram = lastMacd - sig;
  return { value: lastMacd, signal: sig, histogram };
};

const computeATR = (highs, lows, closes, period = 14) => {
  if (!highs || highs.length < period || !lows || lows.length < period || !closes || closes.length < period) return null;
  const trs = [];
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) continue;
    const high = highs[i]; const low = lows[i]; const prevClose = closes[i - 1];
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trs.push(tr);
  }
  if (trs.length < period) return null;
  let atr = sma(trs.slice(0, period), period);
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
  }
  return atr;
};

export const computeIndicators = (history = []) => {
  const prices = history.map(h => typeof h.price === 'number' ? h.price : null).filter(v => v != null);
  const highs = history.map(h => (typeof h.high === 'number' ? h.high : (typeof h.price === 'number' ? h.price : null))).filter(v => v != null);
  const lows = history.map(h => (typeof h.low === 'number' ? h.low : (typeof h.price === 'number' ? h.price : null))).filter(v => v != null);
  const volumes = history.map(h => Number(h.volume) || 0);

  const rsi = computeRSI(prices, 14);
  const ema20 = emaLast(prices, 20);
  const ema50 = emaLast(prices, 50);
  const macd = computeMACD(prices, 12, 26, 9);
  const atr = computeATR(highs, lows, prices, 14);

  // VWAP simple approximation over available bars
  let vwap = null;
  if (history.length) {
    let pv = 0, v = 0;
    history.forEach(h => { const tp = ((h.high || h.price || 0) + (h.low || h.price || 0) + (h.price || 0)) / 3; pv += tp * (h.volume || 0); v += (h.volume || 0); });
    vwap = v ? (pv / v) : null;
  }

  let trend = 'sideways';
  if (ema20 != null && ema50 != null) {
    const diff = ema20 - ema50;
    const pct = diff / (Math.abs(ema50) || 1);
    if (pct > 0.02) trend = 'strong_bull';
    else if (pct > 0.005) trend = 'weak_bull';
    else if (pct < -0.02) trend = 'strong_bear';
    else if (pct < -0.005) trend = 'weak_bear';
    else trend = 'sideways';
  }

  return { rsi, ema20, ema50, macd, atr, vwap, trend };
};

export const generateSignals = (indicators = {}, history = []) => {
  const alerts = [];
  try {
    if (indicators.rsi != null && indicators.rsi < 30) alerts.push('Oversold');
    if (indicators.rsi != null && indicators.rsi > 70) alerts.push('Overbought');
    if (indicators.macd) {
      if (indicators.macd.histogram > 0) alerts.push('MACD Bullish');
      else if (indicators.macd.histogram < 0) alerts.push('MACD Bearish');
    }
    if (indicators.ema20 != null && indicators.ema50 != null) {
      if (indicators.ema20 > indicators.ema50) alerts.push('EMA Crossover (Bullish)');
      else alerts.push('EMA Crossover (Bearish)');
    }
  } catch (e) { /* noop */ }
  return { primary: alerts[0] || null, alerts };
};

export default { computeIndicators, generateSignals };
