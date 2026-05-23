const { RSI, MACD, EMA, SMA, BollingerBands, ATR, VWAP } = require('technicalindicators');

const calculateRSI = (history, period = 14) => {
    if (!Array.isArray(history) || history.length < period + 1) return [];
    const prices = history.map(h => h.price ?? h.close ?? 0);
    try {
        const rsiVals = RSI.calculate({ values: prices, period });
        const result = [];
        const offset = history.length - rsiVals.length;
        for (let i = 0; i < rsiVals.length; i++) {
            result.push({
                date: history[offset + i]?.date || history[offset + i]?.timestamp,
                value: parseFloat(rsiVals[i].toFixed(2))
            });
        }
        return result;
    } catch (e) {
        console.error('RSI calc error:', e.message);
        return [];
    }
};

const calculateEMA = (prices, period) => {
    if (!Array.isArray(prices) || prices.length < period) return [];
    try {
        const emaVals = EMA.calculate({ values: prices, period });
        const targetLen = prices.length - period;
        if (emaVals.length > targetLen) {
            return emaVals.slice(emaVals.length - targetLen).map(v => parseFloat(v.toFixed(4)));
        }
        return emaVals.map(v => parseFloat(v.toFixed(4)));
    } catch (e) {
        console.error('EMA calc error:', e.message);
        return [];
    }
};

const calculateSMA = (history, period = 20) => {
    if (!Array.isArray(history) || history.length < period) return [];
    const prices = history.map(h => h.price ?? h.close ?? 0);
    try {
        const smaVals = SMA.calculate({ values: prices, period });
        const result = [];
        const offset = history.length - smaVals.length;
        for (let i = 0; i < smaVals.length; i++) {
            result.push({
                date: history[offset + i]?.date || history[offset + i]?.timestamp,
                value: parseFloat(smaVals[i].toFixed(4))
            });
        }
        return result;
    } catch (e) {
        console.error('SMA calc error:', e.message);
        return [];
    }
};

const calculateBollinger = (history, period = 20, multiplier = 2) => {
    if (!Array.isArray(history) || history.length < period) return [];
    const prices = history.map(h => h.price ?? h.close ?? 0);
    try {
        const bbVals = BollingerBands.calculate({ values: prices, period, stdDev: multiplier });
        const result = [];
        const offset = history.length - bbVals.length;
        for (let i = 0; i < bbVals.length; i++) {
            result.push({
                date: history[offset + i]?.date || history[offset + i]?.timestamp,
                middle: parseFloat(bbVals[i].middle.toFixed(4)),
                upper: parseFloat(bbVals[i].upper.toFixed(4)),
                lower: parseFloat(bbVals[i].lower.toFixed(4))
            });
        }
        return result;
    } catch (e) {
        console.error('Bollinger calc error:', e.message);
        return [];
    }
};

const calculateMACD = (history, fast = 12, slow = 26, signal = 9) => {
    if (!Array.isArray(history) || history.length < slow + signal) return [];
    const prices = history.map(h => h.price ?? h.close ?? 0);
    try {
        const macdVals = MACD.calculate({
            values: prices,
            fastPeriod: fast,
            slowPeriod: slow,
            signalPeriod: signal,
            SimpleMAOscillator: false,
            SimpleMASignal: false
        });
        const result = [];
        const offset = history.length - macdVals.length;
        for (let i = 0; i < macdVals.length; i++) {
            result.push({
                date: history[offset + i]?.date || history[offset + i]?.timestamp,
                value: parseFloat((macdVals[i].MACD || 0).toFixed(4)),
                signal: parseFloat((macdVals[i].signal || 0).toFixed(4)),
                histogram: parseFloat((macdVals[i].histogram || 0).toFixed(4))
            });
        }
        return result;
    } catch (e) {
        console.error('MACD calc error:', e.message);
        return [];
    }
};

const calculateATR = (history, period = 14) => {
    if (!Array.isArray(history) || history.length < period + 1) return [];
    const highs = history.map(h => h.high ?? h.price ?? h.close ?? 0);
    const lows = history.map(h => h.low ?? h.price ?? h.close ?? 0);
    const closes = history.map(h => h.close ?? h.price ?? 0);
    try {
        const atrVals = ATR.calculate({ high: highs, low: lows, close: closes, period });
        const result = [];
        const offset = history.length - atrVals.length;
        for (let i = 0; i < atrVals.length; i++) {
            result.push({
                date: history[offset + i]?.date || history[offset + i]?.timestamp,
                value: parseFloat(atrVals[i].toFixed(4))
            });
        }
        return result;
    } catch (e) {
        console.error('ATR calc error:', e.message);
        return [];
    }
};

const calculateVWAP = (history) => {
    if (!Array.isArray(history) || history.length === 0) return [];
    const highs = history.map(h => h.high ?? h.price ?? h.close ?? 0);
    const lows = history.map(h => h.low ?? h.price ?? h.close ?? 0);
    const closes = history.map(h => h.close ?? h.price ?? 0);
    const volumes = history.map(h => h.volume ?? 0);
    try {
        const vwapVals = VWAP.calculate({ high: highs, low: lows, close: closes, volume: volumes });
        const result = [];
        const offset = history.length - vwapVals.length;
        for (let i = 0; i < vwapVals.length; i++) {
            result.push({
                date: history[offset + i]?.date || history[offset + i]?.timestamp,
                value: parseFloat(vwapVals[i].toFixed(4))
            });
        }
        return result;
    } catch (e) {
        console.error('VWAP calc error:', e.message);
        return [];
    }
};

const calculateMomentum = (history, period = 10) => {
    if (!Array.isArray(history) || history.length < period) return [];
    const prices = history.map(h => h.price ?? h.close ?? 0);
    const result = [];
    for (let i = period; i < prices.length; i++) {
        const diff = prices[i] - prices[i - period];
        result.push({
            date: history[i]?.date || history[i]?.timestamp,
            value: parseFloat(diff.toFixed(4))
        });
    }
    return result;
};

const getVolumeStatus = (history, period = 20) => {
    if (!Array.isArray(history) || history.length < period) return 'average';
    const volumes = history.map(h => h.volume || 0);
    const recent = volumes[volumes.length - 1];
    const avg = volumes.slice(-period - 1, -1).reduce((a, b) => a + b, 0) / period;

    if (avg === 0) return 'average';
    const ratio = recent / avg;
    if (ratio > 2) return 'high_volume';
    if (ratio > 1.3) return 'above_average';
    if (ratio > 0.7) return 'average';
    if (ratio > 0.4) return 'below_average';
    return 'low_volume';
};

module.exports = {
    calculateRSI,
    calculateMACD,
    calculateEMA,
    calculateSMA,
    calculateBollinger,
    calculateATR,
    calculateVWAP,
    calculateMomentum,
    getVolumeStatus,
};
