

const calculateRSI = (history, period = 14) => {
    if (history.length < period + 1) return [];
    const prices = history.map(h => h.price);
    const results = [];

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff > 0) gains += diff;
        else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period; i < prices.length; i++) {
        if (i > period) {
            const diff = prices[i] - prices[i - 1];
            avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
            avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
        }
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        results.push({ date: history[i].date, value: parseFloat((100 - 100 / (1 + rs)).toFixed(2)) });
    }

    return results;
};

const calculateEMA = (prices, period) => {
    if (prices.length < period) return [];
    const multiplier = 2 / (period + 1);
    const emas = [];
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < prices.length; i++) {
        ema = (prices[i] - ema) * multiplier + ema;
        emas.push(parseFloat(ema.toFixed(4)));
    }

    return emas;
};

const calculateSMA = (history, period = 20) => {
    if (!Array.isArray(history) || history.length < period) return [];

    const values = history.map((item) => Number(item.price));
    const result = [];

    for (let i = period - 1; i < values.length; i++) {
        const window = values.slice(i - period + 1, i + 1);
        const sum = window.reduce((acc, value) => acc + (Number.isFinite(value) ? value : 0), 0);
        result.push({
            date: history[i].date,
            value: parseFloat((sum / period).toFixed(4)),
        });
    }

    return result;
};

const calculateBollinger = (history, period = 20, multiplier = 2) => {
    if (!Array.isArray(history) || history.length < period) return [];

    const values = history.map((item) => Number(item.price));
    const result = [];

    for (let i = period - 1; i < values.length; i++) {
        const window = values.slice(i - period + 1, i + 1).filter(Number.isFinite);
        if (window.length < period) continue;

        const mean = window.reduce((acc, value) => acc + value, 0) / period;
        const variance = window.reduce((acc, value) => acc + ((value - mean) ** 2), 0) / period;
        const stdDev = Math.sqrt(variance);

        result.push({
            date: history[i].date,
            middle: parseFloat(mean.toFixed(4)),
            upper: parseFloat((mean + multiplier * stdDev).toFixed(4)),
            lower: parseFloat((mean - multiplier * stdDev).toFixed(4)),
        });
    }

    return result;
};

const calculateMACD = (history, fast = 12, slow = 26, signal = 9) => {
    const prices = history.map(h => h.price);
    if (prices.length < slow + signal) return [];

    const fastEMA = calculateEMA(prices, fast);
    const slowEMA = calculateEMA(prices, slow);

    const offset = slow - fast;
    const macdLine = slowEMA.map((val, i) => fastEMA[i + offset] - val);

    const signalLine = calculateEMA(macdLine, signal);
    const signalOffset = macdLine.length - signalLine.length;

    return signalLine.map((sig, i) => ({
        date: history[slow + signal + i - 1]?.date,
        value: parseFloat(macdLine[signalOffset + i].toFixed(4)),
        signal: parseFloat(sig.toFixed(4))
    }));
};

const getVolumeStatus = (history, period = 20) => {
    if (history.length < period) return 'average';
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
    getVolumeStatus,
};
