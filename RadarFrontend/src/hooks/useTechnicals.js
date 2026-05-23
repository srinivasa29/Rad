import { useEffect, useMemo, useState } from 'react';
import { RSI, MACD, EMA, ATR, SMA } from 'technicalindicators';
import { getHistoricalOHLC } from '../api/ohlc';

const toNumber = (v) => (v === null || v === undefined ? NaN : Number(v));

const computeVWAP = (candles) => {
  if (!Array.isArray(candles) || candles.length === 0) return null;
  let cumulativePV = 0;
  let cumulativeV = 0;
  candles.forEach((c) => {
    const typical = (toNumber(c.high) + toNumber(c.low) + toNumber(c.close)) / 3;
    const vol = toNumber(c.volume) || 0;
    cumulativePV += typical * vol;
    cumulativeV += vol;
  });
  return cumulativeV === 0 ? null : cumulativePV / cumulativeV;
};

const seriesFromCandles = (candles) => ({
  close: candles.map((c) => toNumber(c.close)),
  high: candles.map((c) => toNumber(c.high)),
  low: candles.map((c) => toNumber(c.low)),
  open: candles.map((c) => toNumber(c.open)),
  volume: candles.map((c) => Number(c.volume || 0)),
});

export const useTechnicals = (symbol, options = {}) => {
  const { timeframe = '1d', limit = 120, compareTo = '^NSEI' } = options;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [candles, setCandles] = useState([]);
  const [niftyCandles, setNiftyCandles] = useState([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const resp = await getHistoricalOHLC(symbol, timeframe, limit);
        const data = resp?.data || [];
        if (mounted) setCandles(data);

        // fetch NIFTY for RS calculation
        try {
          const r = await getHistoricalOHLC(compareTo, timeframe, limit);
          if (mounted) setNiftyCandles(r?.data || []);
        } catch (e) {
          // ignore
        }
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load OHLC');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [symbol, timeframe, limit, compareTo]);

  const technicals = useMemo(() => {
    if (!candles || candles.length === 0) return { ready: false };
    const s = seriesFromCandles(candles);
    const closes = s.close.filter((v) => !Number.isNaN(v));
    const highs = s.high.filter((v) => !Number.isNaN(v));
    const lows = s.low.filter((v) => !Number.isNaN(v));
    const volumes = s.volume;

    const rsiValues = RSI.calculate({ period: 14, values: closes });
    const macdValues = MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false });
    const ema20 = EMA.calculate({ period: 20, values: closes });
    const ema50 = EMA.calculate({ period: 50, values: closes });
    const atrValues = ATR.calculate({ high: highs, low: lows, close: closes, period: 14 });

    const latest = {
      close: closes[closes.length - 1],
      open: s.open[s.open.length - 1],
      high: highs[highs.length - 1],
      low: lows[lows.length - 1],
      volume: volumes[volumes.length - 1],
    };

    const vwap = computeVWAP(candles.slice(-20));

    const avgVol20 = volumes.slice(-20).reduce((a, b) => a + b, 0) / Math.max(1, Math.min(20, volumes.slice(-20).length));
    const rvol = avgVol20 === 0 ? null : (latest.volume / avgVol20);

    // simple trend detection from EMAs
    const ema20Latest = ema20[ema20.length - 1];
    const ema50Latest = ema50[ema50.length - 1];
    const trend = ema20Latest && ema50Latest ? (ema20Latest > ema50Latest ? 'Bullish' : (ema20Latest < ema50Latest ? 'Bearish' : 'Sideways')) : 'n/a';

    // momentum score heuristic
    const rsiLatest = rsiValues[rsiValues.length - 1] || null;
    const macdLatest = macdValues[macdValues.length - 1] || null;
    const macdHist = macdLatest ? macdLatest.histogram : null;

    let momentumScore = 50;
    if (rsiLatest) momentumScore += Math.max(-25, Math.min(25, (rsiLatest - 50) * 0.5));
    if (macdHist) momentumScore += Math.max(-25, Math.min(25, macdHist * 2));
    if (rvol) momentumScore += Math.max(-15, Math.min(15, (rvol - 1) * 10));
    momentumScore = Math.max(0, Math.min(100, Math.round(momentumScore)));

    // technical signal heuristics
    const signals = [];
    if (rsiLatest !== null && rsiLatest < 30 && rvol > 1.8) signals.push('Oversold Bounce');
    if (rsiLatest !== null && rsiLatest > 70) signals.push('Overbought');
    if (ema20Latest && ema50Latest && ema20Latest > ema50Latest) signals.push('EMA Bullish Crossover');
    if (ema20Latest && ema50Latest && ema20Latest < ema50Latest) signals.push('EMA Bearish Crossover');
    if (rvol && rvol > 2.5) signals.push('Volume Spike');

    // RS vs NIFTY
    let rs = null;
    if (niftyCandles && niftyCandles.length > 20) {
      const stockReturn = (closes[closes.length - 1] - closes[Math.max(0, closes.length - 21)]) / closes[Math.max(0, closes.length - 21)];
      const niftySeries = seriesFromCandles(niftyCandles).close.filter((v) => !Number.isNaN(v));
      const niftyReturn = (niftySeries[niftySeries.length - 1] - niftySeries[Math.max(0, niftySeries.length - 21)]) / niftySeries[Math.max(0, niftySeries.length - 21)];
      const ratio = niftyReturn === 0 ? null : stockReturn / niftyReturn;
      if (ratio !== null) {
        if (ratio > 1.2) rs = 'Outperforming';
        else if (ratio > 1.02) rs = 'Strong';
        else if (ratio < 0.8) rs = 'Underperforming';
        else rs = 'Weak';
      }
    }

    return {
      ready: true,
      latest,
      rsi: rsiLatest,
      macd: macdLatest,
      ema20: ema20Latest,
      ema50: ema50Latest,
      atr: atrValues[atrValues.length - 1] || null,
      vwap,
      rvol: rvol ? Number(rvol.toFixed(2)) : null,
      trend,
      momentumScore,
      signals,
      rs,
      spark: closes.slice(-18),
    };
  }, [candles, niftyCandles]);

  return { loading, error, candles, technicals };
};

export default useTechnicals;
