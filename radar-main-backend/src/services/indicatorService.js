const { calculateRSI, calculateMACD, calculateEMA, getVolumeStatus } = require('../utils/indicators');
const { fetchStockHistory } = require('./stockService');
const { fetchCryptoHistory } = require('./cryptoService');
const { fetchForexHistory } = require('./forexService');

const getTechnicalIndicators = async (assetType, symbol, interval = '1D', options = {}) => {
    const { strictLive = false } = options;
    let history = [];
    const type = assetType?.toLowerCase();
    if (type === 'crypto') {
        history = await fetchCryptoHistory(symbol, interval);
    } else if (type === 'forex') {
        history = await fetchForexHistory(symbol, interval);
    } else if (type === 'stock') {
        history = await fetchStockHistory(symbol, interval, { allowSynthetic: !strictLive });
    } else {
        throw new Error(`Unsupported asset type for indicators: ${assetType}`);
    }

    if (!history || history.length < 26) {
        return {
            rsi: null,
            macd: null,
            ema20: null,
            volumeStatus: 'average',
            lastPrice: history?.length ? history[history.length - 1].price : null,
            previousPrice: history?.length > 1 ? history[history.length - 2].price : null,
            lastChangePercent: null,
            lastUpdatedAt: history?.length ? history[history.length - 1].date : null,
            status: 'insufficient_data'
        };
    }
    const rsiRaw = calculateRSI(history, 14);
    const rsi = rsiRaw.length > 0 ? rsiRaw[rsiRaw.length - 1].value : null;

    const macdRaw = calculateMACD(history);
    const validMacd = macdRaw.filter(m => m.value != null && !isNaN(m.value));
    const macd = validMacd.length > 0 ? {
        value: validMacd[validMacd.length - 1].value,
        signal: validMacd[validMacd.length - 1].signal
    } : null;

    const prices = history.map(h => h.price);
    const emaRaw = calculateEMA(prices, 20);
    const ema20 = emaRaw.length > 0 ? parseFloat(emaRaw[emaRaw.length - 1].toFixed(2)) : null;

    let support = null;
    let resistance = null;
    if (prices.length >= 20) {
        const recent20 = prices.slice(-20);
        support = parseFloat(Math.min(...recent20).toFixed(2));
        resistance = parseFloat(Math.max(...recent20).toFixed(2));
    }

    const volumeStatus = getVolumeStatus(history, 20);
    const last = history[history.length - 1] || null;
    const previous = history[history.length - 2] || null;
    const lastPrice = Number(last?.price);
    const previousPrice = Number(previous?.price);
    const lastChangePercent = Number.isFinite(lastPrice) && Number.isFinite(previousPrice) && previousPrice > 0
        ? Number((((lastPrice - previousPrice) / previousPrice) * 100).toFixed(2))
        : null;
    const lastUpdatedAt = last?.date || null;

    let atr = null;
    if (prices.length >= 14) {
        let trSum = 0;
        let count = 0;
        for (let i = prices.length - 14; i < prices.length; i++) {
            if (i > 0) {
                trSum += Math.abs(prices[i] - prices[i - 1]);
                count++;
            }
        }
        if (count > 0) {
            atr = parseFloat((trSum / count).toFixed(2));
        }
    }

    return {
        rsi,
        macd,
        ema20,
        support,
        resistance,
        volumeStatus,
        atr,
        lastPrice: Number.isFinite(lastPrice) ? lastPrice : null,
        previousPrice: Number.isFinite(previousPrice) ? previousPrice : null,
        lastChangePercent,
        lastUpdatedAt,
    };
};

const getTrendMatrix = async (assetType, symbol, options = {}) => {
    const timeframes = ['5M', '15M', '1H', '1D'];
    const trendMatrix = {};

    for (const tf of timeframes) {
        try {
            const data = await getTechnicalIndicators(assetType, symbol, tf, options);
            let bias = 'neutral';

            if (data.rsi && data.ema20) {
                if (data.rsi > 60 && data.macd && data.macd.value > data.macd.signal) {
                    bias = 'bullish';
                } else if (data.rsi < 40 && data.macd && data.macd.value < data.macd.signal) {
                    bias = 'bearish';
                } else {
                    bias = 'neutral';
                }
            }
            trendMatrix[tf.toLowerCase()] = bias;
        } catch (error) {
            trendMatrix[tf.toLowerCase()] = 'neutral';
        }
    }

    return trendMatrix;
};

module.exports = { getTechnicalIndicators, getTrendMatrix };
