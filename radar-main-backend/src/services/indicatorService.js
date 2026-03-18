const { calculateRSI, calculateMACD, calculateEMA, getVolumeStatus } = require('../utils/indicators');
const { fetchStockHistory } = require('./stockService');
const { fetchCryptoHistory } = require('./cryptoService');
const { fetchForexHistory } = require('./forexService');

const getTechnicalIndicators = async (assetType, symbol, interval = '1D') => {
    let history = [];
    const type = assetType?.toLowerCase();
    if (type === 'crypto') {
        history = await fetchCryptoHistory(symbol, interval);
    } else if (type === 'forex') {
        history = await fetchForexHistory(symbol, interval);
    } else if (type === 'stock') {
        history = await fetchStockHistory(symbol, interval);
    } else {
        throw new Error(`Unsupported asset type for indicators: ${assetType}`);
    }

    if (!history || history.length < 26) {
        throw new Error(`Not enough historical data to compute indicators for ${symbol}`);
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

    const volumeStatus = getVolumeStatus(history, 20);

    return {
        rsi,
        macd,
        ema20,
        volumeStatus
    };
};

const getTrendMatrix = async (assetType, symbol) => {
    const timeframes = ['5M', '15M', '1H', '1D'];
    const trendMatrix = {};

    for (const tf of timeframes) {
        try {
            const data = await getTechnicalIndicators(assetType, symbol, tf);
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
