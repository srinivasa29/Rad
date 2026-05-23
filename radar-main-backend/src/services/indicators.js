const ema = (values, period) => {
    const k = 2 / (period + 1);
    let emaPrev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
    const out = [emaPrev];
    for (let i = period; i < values.length; i++) {
        const v = values[i];
        emaPrev = (v - emaPrev) * k + emaPrev;
        out.push(emaPrev);
    }
    return out;
};

const computeRSI = (closes, period = 14) => {
    if (!Array.isArray(closes) || closes.length < period + 1) return null;
    let gains = 0; let losses = 0;
    for (let i = 1; i <= period; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff >= 0) gains += diff; else losses += Math.abs(diff);
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;
    for (let i = period + 1; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        avgGain = ((avgGain * (period - 1)) + Math.max(diff, 0)) / period;
        avgLoss = ((avgLoss * (period - 1)) + Math.max(-diff, 0)) / period;
    }
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    return Math.round(rsi * 100) / 100;
};

const computeMACD = (closes) => {
    if (!Array.isArray(closes) || closes.length < 26) return null;
    const ema12 = ema(closes, 12);
    const ema26 = ema(closes, 26);
    const macdLine = [];
    const start = ema26.length > 0 ? closes.length - ema26.length : 0;
    for (let i = 0; i < ema26.length; i++) {
        const idx12 = i + (ema12.length - ema26.length);
        macdLine.push(ema12[idx12] - ema26[i]);
    }
    const signal = ema(macdLine, 9);
    const macd = macdLine[macdLine.length - 1];
    const sig = signal[signal.length - 1];
    return { macd: Math.round(macd * 100000) / 100000, signal: Math.round((sig || 0) * 100000) / 100000 };
};

const computeVWAP = (candles) => {
    // candles: [{close, high, low, volume, time}] — compute typical price * vol / vol
    if (!Array.isArray(candles) || candles.length === 0) return null;
    let tpVol = 0; let volSum = 0;
    for (const c of candles) {
        const tp = ((c.high || c.close) + (c.low || c.close) + (c.close)) / 3;
        const v = c.volume || 0;
        tpVol += tp * v;
        volSum += v;
    }
    if (volSum === 0) return null;
    return Math.round((tpVol / volSum) * 100000) / 100000;
};

const computeVolumeSpike = (currentVol, avgVol) => {
    if (!currentVol || !avgVol) return null;
    const spike = currentVol / avgVol;
    return Math.round(spike * 100) / 100; // e.g., 3.5
};

const computeRelStrength = (symChangePct = 0, indexChangePct = 0) => {
    const diff = symChangePct - indexChangePct;
    return Math.round(diff * 100) / 100; // percent points
};

const computeTechnicalScore = ({ rsi, macd, macdSignal, vwapPos, volSpike, relStrength, trendScore = 50 }) => {
    // Normalize sub-scores to 0-100
    const rsiScore = rsi ? (rsi > 70 ? 50 : (rsi < 30 ? 50 : 100 - Math.abs(50 - rsi))) : 50;
    const macdScore = (macd !== null && macdSignal !== null) ? (macd > macdSignal ? 100 : 20) : 50;
    const vwapScore = vwapPos === 'Above' ? 100 : (vwapPos === 'Below' ? 20 : 50);
    const volScore = volSpike ? Math.min(100, volSpike * 20) : 50;
    const relScore = relStrength ? Math.min(100, 50 + relStrength) : 50;
    // weights
    const score = Math.round((rsiScore * 0.2) + (macdScore * 0.2) + (vwapScore * 0.15) + (volScore * 0.1) + (relScore * 0.15) + (trendScore * 0.2));
    return Math.max(0, Math.min(100, score));
};

module.exports = { computeRSI, computeMACD, computeVWAP, computeVolumeSpike, computeRelStrength, computeTechnicalScore };
