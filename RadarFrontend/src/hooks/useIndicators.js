import { useMemo } from 'react';

const calculateEMA = (data, period) => {
  if (data.length < period) return [];
  const emaValues = [];
  const k = 2 / (period + 1);
  
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  let ema = sum / period;
  
  // Pad the first period - 1 elements with the first calculated EMA value
  const firstEma = Number(ema.toFixed(2));
  for (let i = 0; i < period - 1; i++) {
    emaValues.push({ time: data[i].time, value: firstEma });
  }
  emaValues.push({ time: data[period - 1].time, value: firstEma });
  
  for (let i = period; i < data.length; i++) {
    ema = data[i].close * k + ema * (1 - k);
    emaValues.push({ time: data[i].time, value: Number(ema.toFixed(2)) });
  }
  return emaValues;
};

const calculateVWAP = (data) => {
  let cumTypicalVolume = 0;
  let cumVolume = 0;
  const vwapValues = [];
  
  for (let i = 0; i < data.length; i++) {
    const tp = (data[i].high + data[i].low + data[i].close) / 3;
    const vol = data[i].volume || 1;
    cumTypicalVolume += tp * vol;
    cumVolume += vol;
    vwapValues.push({
      time: data[i].time,
      value: Number((cumTypicalVolume / cumVolume).toFixed(2))
    });
  }
  return vwapValues;
};

const calculateRSI = (data, period = 14) => {
  if (data.length <= period) return [];
  const rsiValues = [];
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
  
  // Pad the first period elements with the first calculated RSI value
  const firstRsi = Number(rsi.toFixed(2));
  for (let i = 0; i < period; i++) {
    rsiValues.push({ time: data[i].time, value: firstRsi });
  }
  if (!isNaN(rsi)) {
    rsiValues.push({ time: data[period].time, value: firstRsi });
  }
  
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
    
    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
    if (!isNaN(rsi)) {
      rsiValues.push({ time: data[i].time, value: Number(rsi.toFixed(2)) });
    }
  }
  return rsiValues;
};

const calculateMACD = (data, slow = 26, fast = 12, signal = 9) => {
  if (data.length < slow + signal) return { macdLine: [], signalLine: [], histogram: [] };
  
  const emaFast = calculateEMA(data, fast);
  const emaSlow = calculateEMA(data, slow);
  
  const macdLineMap = new Map();
  const emaSlowMap = new Map(emaSlow.map(x => [x.time, x.value]));
  const macdValues = [];
  
  for (const f of emaFast) {
    if (emaSlowMap.has(f.time)) {
      const macdVal = f.value - emaSlowMap.get(f.time);
      macdValues.push({ time: f.time, close: macdVal });
      macdLineMap.set(f.time, macdVal);
    }
  }
  
  const signalLine = calculateEMA(macdValues, signal);
  const signalMap = new Map(signalLine.map(x => [x.time, x.value]));
  
  const macdLineFormatted = [];
  const signalLineFormatted = [];
  const histogram = [];
  
  for (const [time, macdVal] of macdLineMap.entries()) {
    if (signalMap.has(time)) {
      const sigVal = signalMap.get(time);
      const hist = macdVal - sigVal;
      
      macdLineFormatted.push({ time, value: Number(macdVal.toFixed(2)) });
      signalLineFormatted.push({ time, value: Number(sigVal.toFixed(2)) });
      histogram.push({ time, value: Number(hist.toFixed(2)) });
    }
  }
  
  return {
    macdLine: macdLineFormatted,
    signalLine: signalLineFormatted,
    histogram
  };
};

const calculateBollingerBands = (data, period = 20, stdDevMult = 2) => {
  if (data.length < period) return { basis: [], upper: [], lower: [] };
  
  const basis = [];
  const upper = [];
  const lower = [];
  
  // Pad the first period - 1 elements
  let firstSum = 0;
  for (let i = 0; i < period; i++) {
    firstSum += data[i].close;
  }
  const firstMean = firstSum / period;
  
  let firstVarianceSum = 0;
  for (let i = 0; i < period; i++) {
    firstVarianceSum += Math.pow(data[i].close - firstMean, 2);
  }
  const firstStdDev = Math.sqrt(firstVarianceSum / period);
  const firstValBasis = Number(firstMean.toFixed(2));
  const firstValUpper = Number((firstMean + firstStdDev * stdDevMult).toFixed(2));
  const firstValLower = Number((firstMean - firstStdDev * stdDevMult).toFixed(2));

  for (let i = 0; i < period - 1; i++) {
    const time = data[i].time;
    basis.push({ time, value: firstValBasis });
    upper.push({ time, value: firstValUpper });
    lower.push({ time, value: firstValLower });
  }

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += data[j].close;
    }
    const mean = sum / period;
    
    let varianceSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      varianceSum += Math.pow(data[j].close - mean, 2);
    }
    const stdDev = Math.sqrt(varianceSum / period);
    
    const time = data[i].time;
    basis.push({ time, value: Number(mean.toFixed(2)) });
    upper.push({ time, value: Number((mean + stdDev * stdDevMult).toFixed(2)) });
    lower.push({ time, value: Number((mean - stdDev * stdDevMult).toFixed(2)) });
  }
  
  return { basis, upper, lower };
};

export const useIndicators = (candles) => {
  return useMemo(() => {
    const cleanCandles = (candles || []).filter(c => 
      c && 
      c.time && 
      !isNaN(c.open) && c.open !== null && 
      !isNaN(c.high) && c.high !== null && 
      !isNaN(c.low) && c.low !== null && 
      !isNaN(c.close) && c.close !== null
    );

    if (cleanCandles.length === 0) {
      return {
        ema20: [],
        ema50: [],
        vwap: [],
        rsi: [],
        macd: { macdLine: [], signalLine: [], histogram: [] },
        bb: { basis: [], upper: [], lower: [] }
      };
    }
    
    return {
      ema20: calculateEMA(cleanCandles, 20),
      ema50: calculateEMA(cleanCandles, 50),
      vwap: calculateVWAP(cleanCandles),
      rsi: calculateRSI(cleanCandles, 14),
      macd: calculateMACD(cleanCandles, 26, 12, 9),
      bb: calculateBollingerBands(cleanCandles, 20, 2)
    };
  }, [candles]);
};

export default useIndicators;
